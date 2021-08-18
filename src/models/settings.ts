export default class Settings {
    mysql: MySqlSettings;
    redis: RedisSettings;
    firebase: FirebaseAdminSettings;
    googleMaps: { dashboard: string, backend: string };
    purchaseCode: string;
    version?: number;
}

export class MySqlSettings {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
}

export class FirebaseAdminSettings {
    driver: FirebaseAdminCredential;
    rider: FirebaseAdminCredential;
}

export class FirebaseAdminCredential {
    keyFile: string;
    dbUrl: string;
}

export class RedisSettings {
    port: number;
    host: string;
    requestDistance: number;
}