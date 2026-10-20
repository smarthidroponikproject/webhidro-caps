// Jalankan fungsi sinkronisasi saat web pertama kali selesai dimuat
window.onload = function() {
    fetchInitialState();
    // Meminta data sensor DAN status relay real-time setiap 2 detik
    setInterval(fetchSensorData, 2000);
};

// 1. Fungsi mengambil setelan Threshold dari memori ESP32
function fetchInitialState() {
    fetch('/get_state')
        .then(response => response.json())
        .then(data => {
            // Sinkronkan dropdown Mode
            document.getElementById('systemMode').value = data.mode;
            changeMode(false); 
            
            // Sinkronkan nilai form pengaturan batas
            document.getElementById('phMin').value = data.phMin;
            document.getElementById('phMax').value = data.phMax;
            document.getElementById('tdsMin').value = data.tdsMin;
            document.getElementById('tdsMax').value = data.tdsMax;
            document.getElementById('humMin').value = data.humMin;
            document.getElementById('humMax').value = data.humMax;
            document.getElementById('tempMax').value = data.tempMax;
            
            // Setel kondisi awal tombol
            updateRelayButton('AirBersih', data.relayAirBersih, 'Air Bersih');
            updateRelayButton('PhUp', data.relayPhUp, 'pH Up');
            updateRelayButton('PhDown', data.relayPhDown, 'pH Down');
            updateRelayButton('NutAB', data.relayNutAB, 'Nutrisi AB');
            updateRelayButton('Exhaust', data.relayExhaust, 'Exhaust');
        })
        .catch(error => console.error('Gagal memuat status awal ESP32:', error));
}

// Fungsi bantuan untuk memperbarui tampilan tombol relay
function updateRelayButton(idSuffix, state, displayName) {
    let btn = document.getElementById('btn' + idSuffix);
    if(state === 'ON') {
        btn.classList.add('active');
        btn.innerText = `Pompa ${displayName} : ON`;
    } else {
        btn.classList.remove('active');
        btn.innerText = `Pompa ${displayName} : OFF`;
    }
}

// 2. Fungsi sinkronisasi data sensor DAN Relay secara Real-Time
function fetchSensorData() {
    fetch('/get_sensors')
        .then(response => response.json())
        .then(data => {
            // Update Text Sensor
            document.getElementById('valPH').innerText = data.ph;
            document.getElementById('valTDS').innerHTML = data.tds + ' <small>ppm</small>';
            document.getElementById('valWaterTemp').innerHTML = data.waterTemp + ' <small>&deg;C</small>';
            document.getElementById('valAirTemp').innerHTML = data.airTemp + ' <small>&deg;C</small>';
            document.getElementById('valHum').innerHTML = data.humidity + ' <small>%</small>';
            
            // Update sinkronisasi tombol jika sistem dalam mode Auto merubah relay fisik
            updateRelayButton('AirBersih', data.relayAirBersih, 'Air Bersih');
            updateRelayButton('PhUp', data.relayPhUp, 'pH Up');
            updateRelayButton('PhDown', data.relayPhDown, 'pH Down');
            updateRelayButton('NutAB', data.relayNutAB, 'Nutrisi AB');
            updateRelayButton('Exhaust', data.relayExhaust, 'Exhaust');
        })
        .catch(error => console.error('Error mengambil data:', error));
}

// 3. Fungsi mengubah Mode (Auto/Manual)
function changeMode(sendToServer = true) {
    let mode = document.getElementById("systemMode").value;
    let isManual = (mode === 'manual');
    
    // Aktifkan atau matikan kuncian interaksi klik tombol
    let buttons = document.querySelectorAll('.controls .btn');
    buttons.forEach(btn => btn.disabled = !isManual);
    
    // Tampilkan/sembunyikan teks peringatan
    document.getElementById("modeWarning").style.display = isManual ? "none" : "block";

    if(sendToServer) {
        fetch(`/set_mode?mode=${mode}`);
    }
}

// 4. Fungsi untuk menekan tombol Relay (Mode Manual)
function toggleRelay(relayName) {
    let displayName = relayName;
    if (relayName === 'airBersih') displayName = 'Air Bersih';
    if (relayName === 'phUp') displayName = 'pH Up';
    if (relayName === 'phDown') displayName = 'pH Down';
    if (relayName === 'nutAB') displayName = 'Nutrisi AB';
    if (relayName === 'exhaust') displayName = 'Exhaust';

    let btnId = 'btn' + relayName.charAt(0).toUpperCase() + relayName.slice(1);
    let btn = document.getElementById(btnId);
    
    let isTurnedOn = !btn.classList.contains('active');
    let state = isTurnedOn ? 'ON' : 'OFF';

    // Kirim perintah klik ke ESP32 dan visual tombol akan otomatis dikoreksi oleh fetchSensorData dalam 2 detik
    fetch(`/control?relay=${relayName}&state=${state}`)
        .then(response => {
            if(response.ok) {
                updateRelayButton(relayName.charAt(0).toUpperCase() + relayName.slice(1), state, displayName);
            }
        })
        .catch(error => alert("Gagal mengirim perintah ke ESP32!"));
}

// 5. Fungsi menyimpan nilai batas pengaturan (Threshold)
function saveThresholds() {
    let phMin = document.getElementById("phMin").value;
    let phMax = document.getElementById("phMax").value;
    let tdsMin = document.getElementById("tdsMin").value;
    let tdsMax = document.getElementById("tdsMax").value;
    let humMin = document.getElementById("humMin").value;
    let humMax = document.getElementById("humMax").value;
    let tempMax = document.getElementById("tempMax").value;

    let url = `/save_settings?phMin=${phMin}&phMax=${phMax}&tdsMin=${tdsMin}&tdsMax=${tdsMax}&humMin=${humMin}&humMax=${humMax}&temp=${tempMax}`;
    
    fetch(url).then(response => { 
        if(response.ok) alert("Pengaturan batas sensor berhasil disimpan!"); 
    }).catch(error => alert("Koneksi terputus, gagal menyimpan!"));
}