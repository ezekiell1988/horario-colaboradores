import pdfplumber
import os
import json

base = 'ia/assets/audio8'
for f in os.listdir(base):
    if f.endswith('.pdf'):
        path = os.path.join(base, f)
        print('Abriendo:', repr(path))
        with pdfplumber.open(path) as pdf:
            print('Paginas:', len(pdf.pages))
            for i, pg in enumerate(pdf.pages):
                print(f'\n=== Pagina {i+1} ===')
                txt = pg.extract_text()
                if txt:
                    print(txt[:5000])
                tables = pg.extract_tables()
                if tables:
                    print(f'  -> {len(tables)} tabla(s) encontrada(s)')
                    for ti, t in enumerate(tables):
                        print(f'  Tabla {ti+1}:')
                        for row in t:
                            print('  ' + ' | '.join(str(c or '').strip() for c in row))
