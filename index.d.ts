declare namespace Orders {
    interface Env {
        port: number;
        db_host: string;
        db_password: string;
        db_database: string;
        db_user: string;
    }
}

export as namespace Orders;
export = Orders;
