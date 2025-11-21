// DATA SDGs per provinsi (versi ringkas)
const provinces = {
  "jawa timur": {
    sdgs: ["Pendidikan Berkualitas", "Ekonomi Layak", "Industri & Infrastruktur"],
    population: "41 juta",
    note: "Prioritas: penguatan UMKM, digitalisasi, dan industri."
  },

  "jawa barat": {
    sdgs: ["Kesehatan", "Pendidikan", "Inovasi Industri"],
    population: "50 juta",
    note: "Provinsi penduduk terbanyak, fokus pada layanan publik."
  },

  "bali": {
    sdgs: ["Pariwisata Hijau", "Ekonomi Berkelanjutan"],
    population: "4 juta",
    note: "Fokus pada ekologi dan wisata ramah lingkungan."
  },

  "dki jakarta": {
    sdgs: ["Kota Berkelanjutan", "Inovasi", "Kesehatan"],
    population: "11 juta",
    note: "Mengembangkan transportasi hijau dan pengurangan emisi."
  },

  "papua": {
    sdgs: ["Kemiskinan", "Kesehatan", "Infrastruktur"],
    population: "4 juta",
    note: "Fokus pada pemerataan pembangunan dan akses kesehatan."
  }
};

// SEARCH FUNCTION
document.getElementById("searchBtn").addEventListener("click", searchProvinsi);
document.getElementById("searchProv").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchProvinsi();
});

function searchProvinsi() {
  let input = document.getElementById("searchProv").value.toLowerCase().trim();

  if (!input) {
    alert("Masukkan nama provinsi!");
    return;
  }

  let result = provinces[input];

  if (!result) {
    alert("Provinsi tidak ditemukan!");
    return;
  }

  // UPDATE UI
  document.getElementById("provName").textContent = input.toUpperCase();

  let sdgList = document.getElementById("provSDGs");
  sdgList.innerHTML = "";
  result.sdgs.forEach(s => {
    let li = document.createElement("li");
    li.textContent = s;
    sdgList.appendChild(li);
  });

  document.getElementById("provPop").textContent = result.population;
  document.getElementById("provNote").textContent = result.note;

  document.getElementById("resultBox").classList.remove("hide");
}
