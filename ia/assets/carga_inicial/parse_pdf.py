"""
Script para extraer y limpiar todos los datos del PDF de programación.
Produce: ia/assets/audio8/programacion.json
"""
import pdfplumber
import os
import json
import re
from collections import defaultdict

base = 'ia/assets/audio8'
pdf_path = next(
    os.path.join(base, f) for f in os.listdir(base) if f.endswith('.pdf')
)

# Mapeo de horas a turno
def horas_a_turno(entrada, salida):
    if entrada == '06:00' and salida == '14:00':
        return 'T1'
    if entrada == '14:00' and salida == '22:00':
        return 'T2'
    if entrada == '22:00' and salida == '06:00':
        return 'T3'
    if entrada == '08:00' and salida == '16:00':
        return 'T_ADMIN'
    return None

# Limpiar texto de celda multi-línea
def limpiar(texto):
    if not texto:
        return ''
    # quitar saltos de línea, colapsar espacios
    return ' '.join(texto.split())

# Parsear campo "Oficial": "018265 ALEMAN CORTEZ EDUWIN ANTONIO Estado: Activo"
RE_OFICIAL = re.compile(
    r'^([\w\-]+)\s+(.+?)\s+Estado:\s*(\w+)$',
    re.DOTALL
)

def parsear_oficial(texto):
    texto = limpiar(texto)
    m = RE_OFICIAL.match(texto)
    if m:
        codigo = m.group(1).strip()
        nombre = m.group(2).strip()
        estado = m.group(3).strip()
        # Si es "Orden de Servicio" no es una persona
        if 'Orden de Servicio' in nombre or codigo.startswith('OS-'):
            return None
        return {'codigo': codigo, 'nombre': nombre, 'estado': estado}
    return None

rows = []
errores = 0

with pdfplumber.open(pdf_path) as pdf:
    print(f'Total páginas: {len(pdf.pages)}')
    for i, pg in enumerate(pdf.pages):
        tables = pg.extract_tables()
        for table in tables:
            # primera fila = encabezados, saltarla
            for row in table[1:]:
                if len(row) < 8:
                    continue
                try:
                    # Columnas: Cliente|Puesto#|NombrePuesto|Fecha|Oficial|HoraEntrada|HoraSalida|Ausentismo|Observaciones
                    puesto_num  = limpiar(row[1])
                    nombre_puesto = limpiar(row[2])
                    fecha_str   = limpiar(row[3])
                    oficial_raw = limpiar(row[4])
                    hora_entrada = limpiar(row[5]) if len(row) > 5 else ''
                    hora_salida  = limpiar(row[6]) if len(row) > 6 else ''
                    ausentismo   = limpiar(row[7]) if len(row) > 7 else ''

                    oficial = parsear_oficial(oficial_raw)
                    if not oficial:
                        continue  # orden de servicio o fila vacía

                    turno = horas_a_turno(hora_entrada, hora_salida)

                    rows.append({
                        'puestoNum': puesto_num,
                        'puestoNombre': nombre_puesto,
                        'fecha': fecha_str,
                        'codigoOficial': oficial['codigo'],
                        'nombreOficial': oficial['nombre'],
                        'estado': oficial['estado'],
                        'horaEntrada': hora_entrada,
                        'horaSalida': hora_salida,
                        'turno': turno,
                        'ausentismo': ausentismo,
                        'pagina': i + 1,
                    })
                except Exception as e:
                    errores += 1

print(f'Filas extraídas: {len(rows)}')
print(f'Errores: {errores}')

# Guardar JSON completo
out_path = os.path.join(base, 'programacion.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)
print(f'Guardado: {out_path}')

# Resumen de empleados únicos
empleados = {}
for r in rows:
    cod = r['codigoOficial']
    if cod not in empleados:
        empleados[cod] = {
            'codigo': cod,
            'nombre': r['nombreOficial'],
            'estado': r['estado'],
            'puestos': set(),
            'turnos': defaultdict(int),
            'fechas': set(),
        }
    empleados[cod]['puestos'].add(r['puestoNum'])
    if r['turno']:
        empleados[cod]['turnos'][r['turno']] += 1
    empleados[cod]['fechas'].add(r['fecha'])

print(f'\nEmpleados únicos: {len(empleados)}')
print('\n--- Lista de empleados ---')
for cod, e in sorted(empleados.items(), key=lambda x: x[1]['nombre']):
    turnos_str = ', '.join(f"{k}:{v}" for k, v in e['turnos'].items())
    puestos_str = '/'.join(sorted(e['puestos']))
    libres = sum(1 for r in rows if r['codigoOficial'] == cod and r['ausentismo'] == 'Libre')
    print(f"  {cod} | {e['nombre']} | puestos:{puestos_str} | turnos: {turnos_str} | libres:{libres}")

# Guardar resumen de empleados
empleados_list = []
for cod, e in sorted(empleados.items(), key=lambda x: x[1]['nombre']):
    libres = sum(1 for r in rows if r['codigoOficial'] == cod and r['ausentismo'] == 'Libre')
    total_dias = len(e['fechas'])
    empleados_list.append({
        'codigo': cod,
        'nombre': e['nombre'],
        'estado': e['estado'],
        'puestos': sorted(e['puestos']),
        'turnosPorTipo': dict(e['turnos']),
        'diasLibres': libres,
        'totalDias': total_dias,
    })

emp_path = os.path.join(base, 'empleados.json')
with open(emp_path, 'w', encoding='utf-8') as f:
    json.dump(empleados_list, f, ensure_ascii=False, indent=2)
print(f'\nEmpleados guardados: {emp_path}')

# Resumen de fechas únicas
fechas = sorted(set(r['fecha'] for r in rows))
print(f'\nFechas en el PDF ({len(fechas)}): {fechas[:5]} ... {fechas[-5:]}')
