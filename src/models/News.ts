import { CompaniesData } from "./CompaniesData";

interface MetaInterface {
    found: number,
    returned: number,
    limit: number,
    page: number
};

export interface DataInterface {
    meta: MetaInterface;
    data: CompaniesData[];
};
