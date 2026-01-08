import { join } from "node:path";
import { ElectronModule } from "@doubleshot/nest-electron";
import { Module } from "@nestjs/common";
import { app, BrowserWindow } from "electron";
import { TypeOrmModule } from "@nestjs/typeorm";
import { entities } from "../api/entities";
import { ClienteModule } from "src/api/clientes/clientes.module";
import { WhatsappModule } from "src/api/whatsapp/whatsapp.module";
import { TurnoModule } from "src/api/turnos/turnos.module";
import { TratamientoModule } from "src/api/tratamientos/tratamientos.module";
import { PagosModule } from "src/api/pagos/pagos.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      database: "db.sql",
      entities,
      type: "sqlite",
      synchronize: true,
    }),
    ClienteModule,
    WhatsappModule,
    TurnoModule,
    TratamientoModule,
    PagosModule,
    ElectronModule.registerAsync({
      useFactory: async () => {
        const isDev = !app.isPackaged;
        const win = new BrowserWindow({
          width: 1024,
          height: 768,
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            preload: join(__dirname, "../preload/index.js"),
          },
        });

        win.on("closed", () => {
          win.destroy();
        });

        const URL = isDev
          ? process.env.DS_RENDERER_URL
          : `file://${join(app.getAppPath(), "dist/render/index.html")}`;

        win.loadURL(URL);

        return { win };
      },
    }),
  ],
})
export class AppModule { }
