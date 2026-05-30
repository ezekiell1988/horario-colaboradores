-- Migración pendiente: agregar diaLibre y diaLibreExtra a la tabla Colaborador
-- Ejecutar cuando la BD esté accesible:
--   npx prisma db push
-- O aplicar este SQL directamente en Azure SQL:

ALTER TABLE [Colaborador]
  ADD [diaLibre]      NVARCHAR(10) NULL,
      [diaLibreExtra] NVARCHAR(10) NULL;
