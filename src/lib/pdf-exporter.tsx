import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 56,
    color: "#111827",
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 28,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
    paddingBottom: 12,
  },
  company: {
    fontSize: 9,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    marginBottom: 4,
  },
  date: {
    fontSize: 10,
    color: "#4b5563",
  },
  body: {
    fontSize: 11,
    lineHeight: 1.7,
    color: "#1f2937",
    whiteSpace: "pre-wrap",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 56,
    right: 56,
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 6,
    fontSize: 9,
    color: "#9ca3af",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

interface InformeData {
  titulo: string;
  fecha: Date;
  cuerpo: string;
}

function InformePDF({ titulo, fecha, cuerpo }: InformeData) {
  const fechaFormateada = fecha.toLocaleDateString("es-CR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <Document
      title={titulo}
      author="Roll Manager"
      subject="Informe de Seguridad"
    >
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.company}>An Allied Universal Company — Roll Manager</Text>
          <Text style={styles.title}>{titulo}</Text>
          <Text style={styles.date}>{fechaFormateada}</Text>
        </View>

        {/* Cuerpo */}
        <Text style={styles.body}>{cuerpo}</Text>

        {/* Pie de página */}
        <View style={styles.footer} fixed>
          <Text>Roll Manager — Informe de Seguridad</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export async function generarPDF(data: InformeData): Promise<Buffer> {
  const buffer = await renderToBuffer(<InformePDF {...data} />);
  return Buffer.from(buffer);
}
