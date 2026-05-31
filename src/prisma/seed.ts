import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

// ── Datos extraídos del PDF de programación ──────────────────────────────────

interface GrupoSeed {
  nombre: string;
  turnoInicioIndex: number;
  fechaInicioRotacion: string;
  miembros: { codigo: string; nombre: string }[];
}

interface EmpleadoSeed {
  codigo: string;
  nombre: string;
  modalidad: string;
  turnoFijo: string | null;
}

interface ProgramacionRow {
  puestoNum: string;
  puestoNombre: string;
  fecha: string;           // dd/MM/yyyy
  codigoOficial: string;
  nombreOficial: string;
  horaEntrada: string;
  horaSalida: string;
  turno: string | null;
  ausentismo: string;
  pagina: number;
}

const REPO_ROOT = path.resolve(__dirname, "../../");
const PDF_DATA_DIR = path.join(REPO_ROOT, "ia/assets/carga_inicial");

function loadJSON<T>(filename: string): T {
  return JSON.parse(fs.readFileSync(path.join(PDF_DATA_DIR, filename), "utf-8")) as T;
}

function parseFecha(ddmmyyyy: string): Date {
  const [dd, mm, yyyy] = ddmmyyyy.split("/");
  return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
}

// Empleados con modalidad MT/FIJO que no están en ningún grupo FULL
// Se asignan al grupo más cercano a su turno de inicio
const MT_FIJO_EXTRA: Record<string, { grupoNombre: string; modalidad: string; turnoFijo: string | null }> = {
  // MT — trabajan entre T1 y T2 (se clasifican por turno de inicio)
  "020000": { grupoNombre: "Grupo T1", modalidad: "MT", turnoFijo: null },
  "020058": { grupoNombre: "Grupo T1", modalidad: "MT", turnoFijo: null },
  "020193": { grupoNombre: "Grupo T1", modalidad: "MT", turnoFijo: null },
  "020108": { grupoNombre: "Grupo T1", modalidad: "MT", turnoFijo: null },
  "020024": { grupoNombre: "Grupo T1", modalidad: "MT", turnoFijo: null },
  "020118": { grupoNombre: "Grupo T1", modalidad: "MT", turnoFijo: null },
  "020117": { grupoNombre: "Grupo T1", modalidad: "MT", turnoFijo: null },
  "019550": { grupoNombre: "Grupo T1", modalidad: "MT", turnoFijo: null },
  "020163": { grupoNombre: "Grupo T2", modalidad: "MT", turnoFijo: null },
  "020143": { grupoNombre: "Grupo T2", modalidad: "MT", turnoFijo: null },
  "020172": { grupoNombre: "Grupo T2", modalidad: "MT", turnoFijo: null },
  // FIJO
  "020001": { grupoNombre: "Grupo T2", modalidad: "FIJO", turnoFijo: "T2" },
  "019997": { grupoNombre: "Grupo T1", modalidad: "FIJO", turnoFijo: "T1" },
  "020019": { grupoNombre: "Grupo T1", modalidad: "FIJO", turnoFijo: "T1" },
  "020162": { grupoNombre: "Grupo T1", modalidad: "FIJO", turnoFijo: "T_ADMIN" },
  "020027": { grupoNombre: "Grupo T1", modalidad: "FIJO", turnoFijo: "T_ADMIN" },
};

// Puesto de trabajo por código de colaborador (extraído del PDF de programación)
const PUESTO_POR_CODIGO: Record<string, string> = {
  "018265": "Puesto 4 Entrada Anexo Hospital L - D 24 hrs",       // ALEMAN CORTEZ
  "019550": "Parqueo bajo techo Torre Médica L-D 06:00-22:00",    // SALGADO COTO
  "019997": "Puesto 6 Torre Parqueo 2 L - D 06:00 A LAS 22:00",  // VARGAS LEON
  "020000": "Puesto 2 Recorridos Hospital L-D 06:00 A LAS 22:00", // ARAYA MORA
  "020001": "Puesto 6 Torre Parqueo 2 L - D 06:00 A LAS 22:00",  // BADILLA CASCANTE
  "020003": "Puesto 9 Monitoreo Torre Médica L - D 24 HRS",       // OCAMPO TENORIO
  "020006": "Puesto 9 Monitoreo Torre Médica L - D 24 HRS",       // GUTIERREZ MENDOZA
  "020007": "Puesto 7 Entrada Emergencias Hospital L - D 24 HRS", // CALVO ARCE
  "020011": "Puesto 3 Monitoreo Hospital L-D 24 hrs",             // BONILLA CAMPOS
  "020012": "Puesto 4 Entrada Anexo Hospital L - D 24 hrs",       // WEPOL FERNANDEZ
  "020015": "Puesto 7 Entrada Emergencias Hospital L - D 24 HRS", // CASTILLO BERMUDEZ
  "020016": "Puesto 1 Entrada Principal Hospital L- D 24 HRS",    // CASTRO BALTODANO FRANCIS
  "020019": "Puesto 8 Edificio Centauro L - D DE LAS 06:00 A LAS 22:00", // UREÑA MAYORGA
  "020024": "Acceso Edificio Geriátrico Torre médica L-D 06:00-22:00",   // MATTEY VASQUEZ
  "020025": "Puesto 7 Entrada Emergencias Hospital L - D 24 HRS", // JIRON CASTRO
  "020027": "Puesto Disponible",                                  // VEGA CORDERO
  "020028": "Puesto 5 Torre Parqueo 1 L - D 24 HRS",             // CHACON SOSA
  "020029": "Recorrido Torre Médica L-D 24 horas",               // UMAÑA BORBON
  "020058": "Puesto 2 Recorridos Hospital L-D 06:00 A LAS 22:00", // BETANCOURT
  "020088": "Puesto 9 Monitoreo Torre Médica L - D 24 HRS",       // RETANA ROJAS
  "020105": "Puesto 3 Monitoreo Hospital L-D 24 hrs",             // MENA SUAZO
  "020107": "Puesto 1 Entrada Principal Hospital L- D 24 HRS",    // PEÑA RAMIREZ
  "020108": "Puesto 8 Edificio Centauro L - D DE LAS 06:00 A LAS 22:00", // JIMENEZ UGALDE
  "020112": "Puesto 3 Monitoreo Hospital L-D 24 hrs",             // HURTADO PEREZ
  "020117": "Puente Torre Médica L-D 06:00-22:00",               // MORALES MORALES
  "020118": "Puente Torre Médica L-D 06:00-22:00",               // MENDIETA GONZALEZ
  "020143": "Acceso Edificio Geriátrico Torre médica L-D 06:00-22:00",   // MARTINEZ BARRANTES
  "020144": "Recorrido Torre Médica L-D 24 horas",               // GOMEZ CUBILLO
  "020161": "Puesto 7 Entrada Emergencias Hospital L - D 24 HRS", // SEGURA GUEVARA
  "020162": "Puesto 7 Entrada Emergencias Hospital L - D 24 HRS", // CHAVARRIA REYES
  "020163": "Puesto 8 Edificio Centauro L - D DE LAS 06:00 A LAS 22:00", // GOMEZ VETTE
  "020172": "Parqueo bajo techo Torre Médica L-D 06:00-22:00",   // SUAREZ LYONS
  "020181": "Puesto 5 Torre Parqueo 1 L - D 24 HRS",             // DURAN VARGAS
  "020182": "Puesto 5 Torre Parqueo 1 L - D 24 HRS",             // RIVERA TORRES
  "020189": "Puesto 4 Entrada Anexo Hospital L - D 24 hrs",       // ZUÑIGA UGARTE
  "020191": "Recorrido Torre Médica L-D 24 horas",               // VICTOR JIRON
  "020193": "Acceso Edificio Geriátrico Torre médica L-D 06:00-22:00",   // BRENES FERNANDEZ
  "020199": "Puesto 1 Entrada Principal Hospital L- D 24 HRS",    // CASTRO BALTODANO RAFAEL
};

async function main() {
  // ── 0. Limpiar BD (respetar FK) ────────────────────────────────────────────
  console.log("🗑️  Limpiando BD...");
  await prisma.excepcionRoll.deleteMany();
  await prisma.asistencia.deleteMany();
  await prisma.informe.deleteMany();
  await prisma.programacionPDF.deleteMany();
  await prisma.user.deleteMany();
  await prisma.colaborador.deleteMany();
  await prisma.grupo.deleteMany();
  console.log("✅ BD limpia\n");

  // ── 1. Usuario admin ───────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin1234!", 12);
  const admin = await prisma.user.create({
    data: { email: "admin@rollmanager.com", passwordHash, rol: "admin" },
  });
  console.log("✅ Admin:", admin.email);

  // ── 2. Cargar datos del PDF ────────────────────────────────────────────────
  const seedData = loadJSON<{ grupos: GrupoSeed[]; empleados: EmpleadoSeed[] }>("grupos_seed.json");
  const programacion = loadJSON<ProgramacionRow[]>("programacion.json");

  // ── 3. Crear grupos FULL ───────────────────────────────────────────────────
  const grupoMap: Record<string, string> = {}; // nombre → id

  for (const g of seedData.grupos) {
    const grupo = await prisma.grupo.create({
      data: {
        nombre: g.nombre,
        turnoInicioIndex: g.turnoInicioIndex,
        fechaInicioRotacion: new Date(g.fechaInicioRotacion + "T00:00:00Z"),
      },
    });
    grupoMap[g.nombre] = grupo.id;
    console.log(`✅ Grupo: ${g.nombre} (id=${grupo.id})`);
  }

  // ── 4. Crear colaboradores FULL (miembros directos de cada grupo) ──────────
  const colabMap: Record<string, string> = {}; // codigo → id

  for (const g of seedData.grupos) {
    const grupoId = grupoMap[g.nombre];
    for (const m of g.miembros) {
      const colab = await prisma.colaborador.create({
        data: {
          nombre: m.nombre,
          modalidad: "FULL",
          turnoFijo: null,
          puesto: PUESTO_POR_CODIGO[m.codigo] ?? null,
          activo: true,
          grupoId,
        },
      });
      colabMap[m.codigo] = colab.id;
      console.log(`  👤 ${m.nombre} → ${g.nombre}`);
    }
  }

  // ── 5. Crear colaboradores MT / FIJO ──────────────────────────────────────
  const empPorCodigo: Record<string, EmpleadoSeed> = {};
  for (const e of seedData.empleados) {
    empPorCodigo[e.codigo] = e;
  }

  for (const [codigo, extra] of Object.entries(MT_FIJO_EXTRA)) {
    if (colabMap[codigo]) continue; // ya creado
    const emp = empPorCodigo[codigo];
    if (!emp) continue;
    const grupoId = grupoMap[extra.grupoNombre];
    if (!grupoId) continue;
    const colab = await prisma.colaborador.create({
      data: {
        nombre: emp.nombre,
        modalidad: extra.modalidad,
        turnoFijo: extra.turnoFijo ?? null,
        puesto: PUESTO_POR_CODIGO[codigo] ?? null,
        activo: true,
        grupoId,
      },
    });
    colabMap[codigo] = colab.id;
    console.log(`  👤 ${emp.nombre} (${extra.modalidad}) → ${extra.grupoNombre}`);
  }

  // ── 6. Insertar ProgramacionPDF ────────────────────────────────────────────
  console.log(`\n📥 Importando ${programacion.length} registros del PDF...`);
  let importados = 0;
  const BATCH = 50;

  for (let i = 0; i < programacion.length; i += BATCH) {
    const batch = programacion.slice(i, i + BATCH);
    await prisma.programacionPDF.createMany({
      data: batch.map((r) => ({
        puestoNum: r.puestoNum,
        puestoNombre: r.puestoNombre,
        fecha: parseFecha(r.fecha),
        codigoOficial: r.codigoOficial,
        nombreOficial: r.nombreOficial,
        horaEntrada: r.horaEntrada || null,
        horaSalida: r.horaSalida || null,
        turno: r.turno || null,
        ausentismo: r.ausentismo,
        pagina: r.pagina,
      })),
    });
    importados += batch.length;
  }
  console.log(`✅ ProgramacionPDF: ${importados} filas insertadas`);

  // ── 7. Resumen ─────────────────────────────────────────────────────────────
  const [nGrupos, nColabs, nPDF] = await Promise.all([
    prisma.grupo.count(),
    prisma.colaborador.count(),
    prisma.programacionPDF.count(),
  ]);
  console.log(`\n📊 BD final: ${nGrupos} grupos | ${nColabs} colaboradores | ${nPDF} registros PDF`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
