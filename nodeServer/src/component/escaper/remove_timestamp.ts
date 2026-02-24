export function remove_timestamp(input: string): string {
    let result = input;
    while (true) {
        const newResult = result.replace(/^\^[^:]+:(?:\d{8}_\d{6}:)?/, '');
        if (newResult === result) break;
        result = newResult;
    }
    if (result !== input) {
        console.log("去除了不正确的时间戳");
    }
    return result;
}
