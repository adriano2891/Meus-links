const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function bundle() {
  const zip = new JSZip();
  const extensionDir = path.join(__dirname, '..', 'extension');
  const outDir = path.join(__dirname, '..', 'public', 'downloads');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  function addDir(dirPath, zipFolder) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const sub = zipFolder.folder(entry.name);
        addDir(fullPath, sub);
      } else {
        const data = fs.readFileSync(fullPath);
        zipFolder.file(entry.name, data);
      }
    }
  }

  addDir(extensionDir, zip);

  zip.file(
    "LEIA-ME_INSTALACAO.txt",
    `=============================================================
MEUS LINKS - EXTENSÃO OFICIAL PARA GOOGLE CHROME / CHROMIUM
=============================================================

Passos para instalar no Google Chrome, Brave, Edge ou Opera:

1. Extraia o conteúdo deste arquivo ZIP em uma pasta segura do seu computador
   (Ex: Documentos/MeusLinks-Extensao).

2. Abra seu navegador Chrome e acesse na barra de endereços:
   chrome://extensions

3. No canto superior direito, ATIVE a chave:
   "Modo do desenvolvedor" (Developer mode).

4. No canto superior esquerdo, clique no botão:
   "Carregar sem compactação" (Load unpacked).

5. Selecione a pasta onde você descompactou os arquivos da extensão.

6. Pronto! A extensão do Meus Links aparecerá na barra de ferramentas.
   Fixe-a clicando no ícone de quebra-cabeça e depois no alfinete.

7. Clique no ícone da extensão para fazer login com seu e-mail e senha.
   A partir de agora, você pode salvar qualquer página com 1 clique ou usando o atalho Alt + S!
=============================================================
`
  );

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  const targetPath = path.join(outDir, 'meus-links-extensao-v3.zip');
  fs.writeFileSync(targetPath, buffer);
  console.log(`Successfully generated ${targetPath} (${buffer.length} bytes)`);
}

bundle().catch(console.error);
