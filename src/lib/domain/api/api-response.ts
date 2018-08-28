export class ApiResponse {
    status: number;
    msg: any;
    data: any;
    requestData: any;

    isValid(): boolean {
        return this.status >= 200 && this.status < 300;
    }
}
