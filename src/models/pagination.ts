class Pagination {
    data: any[];
    page: number;
    total: number;
    constructor(data, page, total) {
        this.data = data;
        this.page = page;
        this.total = total;
    }
}

export default Pagination;