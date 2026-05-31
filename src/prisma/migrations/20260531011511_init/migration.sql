BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [rol] NVARCHAR(1000) NOT NULL,
    [colaboradorId] NVARCHAR(1000),
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [User_colaboradorId_key] UNIQUE NONCLUSTERED ([colaboradorId])
);

-- CreateTable
CREATE TABLE [dbo].[Colaborador] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [puesto] NVARCHAR(50),
    [modalidad] NVARCHAR(15) NOT NULL CONSTRAINT [Colaborador_modalidad_df] DEFAULT 'FULL',
    [turnoFijo] NVARCHAR(2),
    [fechaInicioPersonal] DATETIME2,
    [diaLibre] NVARCHAR(10),
    [diaLibreExtra] NVARCHAR(10),
    [activo] BIT NOT NULL CONSTRAINT [Colaborador_activo_df] DEFAULT 1,
    [grupoId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Colaborador_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Grupo] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [turnoInicioIndex] INT NOT NULL,
    [fechaInicioRotacion] DATETIME2 NOT NULL,
    CONSTRAINT [Grupo_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Asistencia] (
    [id] NVARCHAR(1000) NOT NULL,
    [colaboradorId] NVARCHAR(1000) NOT NULL,
    [fecha] DATETIME2 NOT NULL,
    [turno] NVARCHAR(1000) NOT NULL,
    [puesto] NVARCHAR(1000) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Asistencia_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Asistencia_colaboradorId_fecha_key] UNIQUE NONCLUSTERED ([colaboradorId],[fecha])
);

-- CreateTable
CREATE TABLE [dbo].[Informe] (
    [id] NVARCHAR(1000) NOT NULL,
    [fecha] DATETIME2 NOT NULL,
    [titulo] NVARCHAR(1000) NOT NULL,
    [contenido] NVARCHAR(max) NOT NULL,
    [textoFormal] NVARCHAR(max),
    [pdfUrl] NVARCHAR(1000),
    [creadoPor] NVARCHAR(1000) NOT NULL,
    [creadoAt] DATETIME2 NOT NULL CONSTRAINT [Informe_creadoAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Informe_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ExcepcionRoll] (
    [id] NVARCHAR(1000) NOT NULL,
    [colaboradorId] NVARCHAR(1000) NOT NULL,
    [semana] DATETIME2 NOT NULL,
    [tipo] NVARCHAR(1000) NOT NULL,
    [nota] NVARCHAR(1000),
    CONSTRAINT [ExcepcionRoll_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ExcepcionRoll_colaboradorId_semana_key] UNIQUE NONCLUSTERED ([colaboradorId],[semana])
);

-- CreateTable
CREATE TABLE [dbo].[ProgramacionPDF] (
    [id] NVARCHAR(1000) NOT NULL,
    [puestoNum] NVARCHAR(10) NOT NULL,
    [puestoNombre] NVARCHAR(200) NOT NULL,
    [fecha] DATETIME2 NOT NULL,
    [codigoOficial] NVARCHAR(20) NOT NULL,
    [nombreOficial] NVARCHAR(150) NOT NULL,
    [horaEntrada] NVARCHAR(5),
    [horaSalida] NVARCHAR(5),
    [turno] NVARCHAR(10),
    [ausentismo] NVARCHAR(20) NOT NULL,
    [pagina] INT NOT NULL,
    CONSTRAINT [ProgramacionPDF_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProgramacionPDF_codigoOficial_idx] ON [dbo].[ProgramacionPDF]([codigoOficial]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProgramacionPDF_fecha_idx] ON [dbo].[ProgramacionPDF]([fecha]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_colaboradorId_fkey] FOREIGN KEY ([colaboradorId]) REFERENCES [dbo].[Colaborador]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Colaborador] ADD CONSTRAINT [Colaborador_grupoId_fkey] FOREIGN KEY ([grupoId]) REFERENCES [dbo].[Grupo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asistencia] ADD CONSTRAINT [Asistencia_colaboradorId_fkey] FOREIGN KEY ([colaboradorId]) REFERENCES [dbo].[Colaborador]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Informe] ADD CONSTRAINT [Informe_creadoPor_fkey] FOREIGN KEY ([creadoPor]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ExcepcionRoll] ADD CONSTRAINT [ExcepcionRoll_colaboradorId_fkey] FOREIGN KEY ([colaboradorId]) REFERENCES [dbo].[Colaborador]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
