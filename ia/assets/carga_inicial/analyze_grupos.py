"""
Analiza los patrones de turno por semana para determinar grupos de rotación.
Produce: ia/assets/audio8/grupos_seed.json (ready para seed Prisma)
"""
import json
from datetime import datetime, timedelta
from collections import defaultdict

with open('ia/assets/audio8/programacion.json', encoding='utf-8') as f:
    rows = json.load(f)

# Determinar la fecha del lunes de cada semana
def lunes_de_fecha(fecha_str):
    d = datetime.strptime(fecha_str, '%d/%m/%Y')
    # lunes = weekday 0
    lunes = d - timedelta(days=d.weekday())
    return lunes.strftime('%Y-%m-%d')

# Agrupar: empleado → semana → lista de turnos
emp_semana_turno = defaultdict(lambda: defaultdict(list))
emp_info = {}

for r in rows:
    cod = r['codigoOficial']
    if not cod:
        continue
    emp_info[cod] = r['nombreOficial']
    if r['turno'] and r['ausentismo'] != 'Libre':
        semana = lunes_de_fecha(r['fecha'])
        emp_semana_turno[cod][semana].append(r['turno'])

# Calcular total de turnos por tipo para clasificar modalidad
emp_totales = {}
for r in rows:
    cod = r['codigoOficial']
    if cod not in emp_totales:
        emp_totales[cod] = defaultdict(int)
    if r['turno']:
        emp_totales[cod][r['turno']] += 1

# Clasificar modalidad
def clasificar_modalidad(turnos_dict):
    t1 = turnos_dict.get('T1', 0)
    t2 = turnos_dict.get('T2', 0)
    t3 = turnos_dict.get('T3', 0)
    admin = turnos_dict.get('T_ADMIN', 0)
    total = t1 + t2 + t3 + admin
    
    if admin > 10:
        return 'FIJO', 'T_ADMIN'
    # si un solo turno domina (>80% del total útil)
    util = t1 + t2 + t3
    if util == 0:
        return 'FIJO', 'T_ADMIN'
    if t1 / util > 0.7:
        return 'FIJO', 'T1'
    if t2 / util > 0.7:
        return 'FIJO', 'T2'
    if t3 / util > 0.7:
        return 'FIJO', 'T3'
    # Si tiene dos turnos (no tres) → MT o MT_ALTERNO
    tipos = sum(1 for v in [t1, t2, t3] if v > 0)
    if tipos == 2:
        return 'MT', None
    # Tres turnos → FULL
    return 'FULL', None

# Para empleados FULL, determinar turno en la primera semana
semanas = sorted(set(lunes_de_fecha(r['fecha']) for r in rows))
print(f'Semanas encontradas: {semanas}')
primera_semana = semanas[0]

# Determinar turno_inicio de la primera semana para empleados FULL
# Turno más frecuente en esa semana
def turno_primer_semana(cod):
    s = emp_semana_turno[cod].get(primera_semana, [])
    if not s:
        # buscar siguiente semana
        for sem in semanas[1:]:
            s = emp_semana_turno[cod].get(sem, [])
            if s:
                break
    if not s:
        return None
    from collections import Counter
    c = Counter(s)
    return c.most_common(1)[0][0]

# Agrupar FULL employees por turno inicial → mismo grupo
grupos_full = defaultdict(list)  # turno_inicio → [cod]
empleados_clasificados = []

for cod, nombre in sorted(emp_info.items(), key=lambda x: x[1]):
    modalidad, turno_fijo = clasificar_modalidad(emp_totales.get(cod, {}))
    
    if modalidad == 'FULL':
        t_inicio = turno_primer_semana(cod)
        grupos_full[t_inicio].append(cod)
    
    empleados_clasificados.append({
        'codigo': cod,
        'nombre': nombre,
        'modalidad': modalidad,
        'turnoFijo': turno_fijo,
        'turnoInicioSemana1': turno_primer_semana(cod) if modalidad in ('FULL', 'MT') else turno_fijo,
        'turnos': dict(emp_totales.get(cod, {})),
    })
    print(f"  {cod} | {nombre[:35]:<35} | {modalidad} | turnoFijo={turno_fijo} | inicio={turno_primer_semana(cod) if modalidad in ('FULL', 'MT') else turno_fijo}")

print(f'\nGrupos FULL detectados:')
grupo_idx = {'T1': 0, 'T2': 1, 'T3': 2}
grupos_seed = []
for turno, miembros in grupos_full.items():
    print(f'  Grupo turno-inicio={turno}: {len(miembros)} empleados')
    for c in miembros:
        print(f'    {c} {emp_info[c]}')
    grupos_seed.append({
        'nombre': f'Grupo {turno}',
        'turnoInicioIndex': grupo_idx.get(turno, 0),
        'fechaInicioRotacion': primera_semana,  # lunes de semana 1
        'miembros': [{'codigo': c, 'nombre': emp_info[c]} for c in miembros],
    })

# Guardar resultado completo para seed
result = {
    'semanas': semanas,
    'primeraSemanaMondayISO': primera_semana,
    'grupos': grupos_seed,
    'empleados': empleados_clasificados,
}

with open('ia/assets/audio8/grupos_seed.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print('\nGuardado: ia/assets/audio8/grupos_seed.json')
