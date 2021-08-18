import Settings from "../models/settings";
import { promises as fs } from 'fs';

export default class Config {
    settings: Settings

    constructor() {
    }

    async init() {
        await fs.mkdir(`${process.cwd()}/config`, {recursive: true});
        try {
            await fs.stat(`${process.cwd()}/config/config.${process.env.NODE_ENV}.json`);
        }catch(exception) {
            await fs.writeFile(`${process.cwd()}/config/config.${process.env.NODE_ENV}.json`, '{}');
        }
        this.settings = require(`${process.cwd()}/config/config.${process.env.NODE_ENV}.json`) as Settings;
    }

    isConfiged(): boolean {
        return (this.settings != null && this.settings.googleMaps != undefined && this.settings.purchaseCode != undefined && this.settings.version != undefined && this.settings.version == 2);
    }

    async save(): Promise<boolean> {
        let str = JSON.stringify(this.settings);
        await fs.writeFile(`${process.cwd()}/config/config.${process.env.NODE_ENV}.json`, str);
        return true;
    }
}