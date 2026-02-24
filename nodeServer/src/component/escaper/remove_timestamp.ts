export function remove_timestamp(input: string): string {
    const pattern = /^(\^[^:]+:\d{8}_\d{6}:)*/;
    if(input.replace(pattern, '') !== input)
        console.log("去除了不正确的时间戳")
    return input.replace(pattern, '');
}
