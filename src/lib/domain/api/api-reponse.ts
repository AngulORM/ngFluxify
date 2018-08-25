export class ApiResponse {
    status: number;
    function: string;
    page: string;
    msg: any;
    data: any;
    requestData: any;

    estValide(): boolean {
        return this.status >= 200 && this.status < 300;
    }
}
