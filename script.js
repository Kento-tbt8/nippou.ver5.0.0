const gasUrl = 'https://script.google.com/macros/s/AKfycbzK_H2Ck00AJnXwjk-Xp1KQj-W4wXxoEuvIoiw8MJGtkEzyimqSSMkbZM6bV09FIzrb/exec';

let globalMaterialList = [];
let siteMasterData = [];

document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    const y = now.getFullYear(), m = ("0" + (now.getMonth() + 1)).slice(-2), d = ("0" + now.getDate()).slice(-2);
    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.value = `${y}-${m}-${d}`;
    fetchLists();

    // 「その他項目」の初期行を追加
    addExtraRow();
});

async function fetchLists() {
    try {
        const res = await fetch(gasUrl);
        const data = await res.json();
        siteMasterData = data.sites || [];
        globalMaterialList = data.materials || [];

        const siteSelect = document.getElementById('site');
        if (siteSelect) {
            siteSelect.innerHTML = '<option value="" disabled selected>現場を選択</option>';
            siteMasterData.forEach(s => {
                const opt = document.createElement('option');
                opt.value = opt.textContent = s.name;
                siteSelect.appendChild(opt);
            });
            siteSelect.innerHTML += '<option value="OTHER_SITE">その他</option>';
        }
        addDynamicRow('materialContainer', 'mat-input');
    } catch (e) {
        console.error('データ取得失敗');
    }
}

// 現場名→自動反映
document.getElementById('site').addEventListener('change', (e) => {
    const otherInput = document.getElementById('otherSiteInput');
    const info = siteMasterData.find(s => s.name === e.target.value);

    if (e.target.value === "OTHER_SITE") {
        if(otherInput) {
            otherInput.style.display = 'block';
            otherInput.required = true;
        }
        document.getElementById('director').value = "";
        document.getElementById('primeContractor').value = "";
        document.getElementById('salesStaff').value = "";
    } else {
        if(otherInput) {
            otherInput.style.display = 'none';
            otherInput.required = false;
            otherInput.value = "";
        }
        if (info) {
            document.getElementById('director').value = info.director || "";
            document.getElementById('primeContractor').value = info.prime || "";
            document.getElementById('salesStaff').value = info.staff || "";
            document.getElementById('memberCount').value = info.Count || "";
            document.getElementById('memberName').value = info.Name || "";
        }
    }
});

// 材料行の追加
function addDynamicRow(containerId, inputClass) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.style.flexWrap = 'wrap';

    let options = '<option value="" disabled selected>材料を選択</option>';
    globalMaterialList.forEach(m => { options += `<option value="${m}">${m}</option>`; });
    options += '<option value="OTHER_MAT">その他（直接入力）</option>';

    div.innerHTML = `
        <select class="${inputClass} flex-grow" onchange="checkMatOther(this)">${options}</select>
        <input type="text" class="other-mat-name" style="display:none; flex:1 1 100%; margin-top:5px;" placeholder="材料名を入力">
        <input type="text" style="width: 60px;" class="mat-qty" placeholder="数量">
        <button type="button" class="remove-btn">×</button>
    `;
    container.appendChild(div);
    updateRemoveButtons(containerId);
}

// ★追加項目：その他（経費・備品など）の行追加
function addExtraRow() {
    const container = document.getElementById('extraContainer');
    if(!container) return;
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.innerHTML = `
        <input type="text" class="extra-item flex-grow" placeholder="材料名">
        <input type="text" style="width: 80px;" class="extra-qty" placeholder="数量">
        <button type="button" class="remove-btn">×</button>
    `;
    container.appendChild(div);
    
    const updateExtraBtns = () => {
        const rows = container.querySelectorAll('.dynamic-row');
        rows.forEach(row => {
            const btn = row.querySelector('.remove-btn');
            btn.onclick = () => { if (rows.length > 1) row.remove(); updateExtraBtns(); };
            btn.disabled = (rows.length === 1);
            btn.style.opacity = (rows.length === 1) ? "0.3" : "1";
        });
    };
    updateExtraBtns();
}

document.getElementById('addExtraBtn').onclick = addExtraRow;

function checkMatOther(select) {
    const otherInput = select.parentElement.querySelector('.other-mat-name');
    if (select.value === "OTHER_MAT") {
        otherInput.style.display = 'block';
    } else {
        otherInput.style.display = 'none';
        otherInput.value = "";
    }
}

function updateRemoveButtons(containerId) {
    const rows = document.getElementById(containerId).querySelectorAll('.dynamic-row');
    rows.forEach(row => {
        const btn = row.querySelector('.remove-btn');
        if (btn) {
            btn.onclick = () => { if (rows.length > 1) row.remove(); updateRemoveButtons(containerId); };
            btn.disabled = (rows.length === 1);
            btn.style.opacity = (rows.length === 1) ? "0.3" : "1";
        }
    });
}

const showStep = (s) => {
    ['step1', 'step2', 'step3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    document.getElementById(`step${s}`).style.display = 'block';
    window.scrollTo(0, 0);
};

// Step1 → 2
document.getElementById('nextBtn1').onclick = () => {
    const fields = ['record', 'date', 'startTime', 'endTime', 'weather', 'site'];
    if (!fields.every(id => document.getElementById(id).value)) { alert('未入力項目があります'); return; }

    const locInputs = document.querySelectorAll('.loc-input');
    const hasLocInput = Array.from(locInputs).some(input => input.value.trim() !== "");
    if (!hasLocInput) { alert('施工箇所を1つは入力してください'); return; }
    showStep(2);
};

// Step2 → 3
document.getElementById('nextBtn2').onclick = () => {
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : "";
    };

    const setConf = (id, val) => {
        const el = document.getElementById(id);
        if(el) el.innerText = val;
    };

    setConf('conf-record', getVal('record'));
    setConf('conf-date', getVal('date'));
    setConf('conf-weather', getVal('weather'));
    setConf('conf-time', `${getVal('startTime')} 〜 ${getVal('endTime')}`);
    
    const siteVal = getVal('site');
    setConf('conf-site', (siteVal === "OTHER_SITE") ? getVal('otherSiteInput') : siteVal);
    
    setConf('conf-director', getVal('director'));
    setConf('conf-primeContractor', getVal('primeContractor'));
    setConf('conf-salesStaff', getVal('salesStaff'));
    setConf('conf-name', getVal('memberName'));
    setConf('conf-count', getVal('memberCount'));
    
    const support = getVal('supportMember') || getVal('support');
    setConf('conf-support', support || "なし");
    setConf('conf-notes', getVal('notes') || "なし");
    
    renderConfirmLists();
    showStep(3);
};

function renderConfirmLists() {
    // 施工箇所（備考含む）
    const locList = document.getElementById('conf-locations-list');
    locList.innerHTML = '<strong>【施工箇所】</strong>';
    document.querySelectorAll('.loc-input').forEach(i => {
        if (i.value) {
            const div = document.createElement('div');
            const parent = i.parentElement;
            const qty = parent.querySelector('.loc-qty').value || 0;
            const unit = parent.querySelector('.loc-unit').value || "";
            const note = parent.querySelector('.loc-notes') ? parent.querySelector('.loc-notes').value : "";
            div.innerText = `・${i.value} ： ${qty}${unit} ${note ? '('+note+')' : ''}`;
            locList.appendChild(div);
        }
    });

    // 材料
    const matList = document.getElementById('conf-materials-list');
    matList.innerHTML = '<strong>【使用材料】</strong>';
    document.querySelectorAll('.mat-input').forEach(select => {
        let name = select.value;
        if (name === "OTHER_MAT") name = select.parentElement.querySelector('.other-mat-name').value;
        if (name && name !== "OTHER_MAT") {
            const div = document.createElement('div');
            const qty = select.parentElement.querySelector('.mat-qty').value || 0;
            div.innerText = `・${name} ： ${qty}`;
            matList.appendChild(div);
        }
    });

    // ★追加項目：その他項目の表示
    const extraList = document.getElementById('conf-extra-list') || document.createElement('div');
    extraList.id = 'conf-extra-list';
    extraList.innerHTML = '<strong>【その他項目】</strong>';
    document.querySelectorAll('.extra-item').forEach(input => {
        if (input.value) {
            const div = document.createElement('div');
            const qty = input.parentElement.querySelector('.extra-qty').value || "";
            div.innerText = `・${input.value} ： ${qty}`;
            extraList.appendChild(div);
        }
    });
    matList.after(extraList);
}

document.getElementById('addMaterialBtn').onclick = () => addDynamicRow('materialContainer', 'mat-input');
document.getElementById('backBtn1').onclick = () => showStep(1);
document.getElementById('backBtn2').onclick = () => showStep(2);

// 送信
document.getElementById('reportForm').onsubmit = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true; btn.innerText = "送信中...";

    const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : "";

    const siteVal = getVal('site');
    const finalSiteName = (siteVal === "OTHER_SITE") ? getVal('otherSiteInput') : siteVal;

    const locArray = Array.from(document.querySelectorAll('.loc-input')).map(v => {
        const p = v.parentElement;
        return {
            loc: v.value,
            qty: p.querySelector('.loc-qty').value || 0,
            unit: p.querySelector('.loc-unit').value || "",
            notes: p.querySelector('.loc-notes') ? p.querySelector('.loc-notes').value : ""
        };
    }).filter(i => i.loc !== "");

    const matArray = Array.from(document.querySelectorAll('.mat-input')).map(select => {
        let name = select.value;
        if (name === "OTHER_MAT") name = select.parentElement.querySelector('.other-mat-name').value;
        return { name: name, qty: select.parentElement.querySelector('.mat-qty').value || 0 };
    }).filter(i => i.name && i.name !== "OTHER_MAT" && i.name !== "");

    // ★追加項目：その他項目のデータ収集
    const extraArray = Array.from(document.querySelectorAll('.extra-item')).map(input => {
        return { item: input.value, qty: input.parentElement.querySelector('.extra-qty').value || "" };
    }).filter(i => i.item !== "");

    const payload = {
        record: getVal('record'),
        date: getVal('date'),
        startTime: getVal('startTime'),
        endTime: getVal('endTime'),
        weather: getVal('weather'),
        site: finalSiteName,
        director: getVal('director'),
        primeContractor: getVal('primeContractor'),
        salesStaff: getVal('salesStaff'),
        name: getVal('memberName'),
        count: getVal('memberCount'),
        supportMember: getVal('support') || getVal('supportMember'),
        notes: getVal('notes'),
        locationArray: locArray,
        materialArray: matArray,
        extraArray: extraArray
    };

    try {
        await fetch(gasUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
        alert('日報の送信が完了しました！');
        window.location.href = "https://s.lmes.jp/landing-qr/2008206389-v2GmkqBg?uLand=jHRWfS";
    } catch (e) {
        alert('送信失敗');
        btn.disabled = false; btn.innerText = "送信する";
    }
};