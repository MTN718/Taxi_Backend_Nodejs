import {MigrationInterface, QueryRunner} from "typeorm";

export class seedAdminOperator1573397187505 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`INSERT INTO operator (userName, password) VALUES ('admin', 'admin')`)
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
    }

}
