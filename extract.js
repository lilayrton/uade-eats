const fs = require('fs');
const pdf = require('pdf-parse');

async function extract() {
  try {
    let dataBuffer1 = fs.readFileSync('info_locales/RUS_UADE_Menú_digital.pdf');
    let data1 = await pdf(dataBuffer1);
    console.log("=== RUSTICA ===");
    console.log(data1.text.substring(0, 1000)); // Just print the first 1000 chars for now to inspect the format

    let dataBuffer2 = fs.readFileSync('info_locales/Menu_La_Cantina.pdf');
    let data2 = await pdf(dataBuffer2);
    console.log("\n=== LA CANTINA ===");
    console.log(data2.text.substring(0, 1000));
  } catch (e) {
    console.error("Error:", e);
  }
}

extract();
