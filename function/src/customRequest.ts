import * as https from 'https';

export const CustomRequest = {
    get: (url: string) => {
        return new Promise((resolve, reject) => {
            const req = https.get(url, (res) => {
                let rawData = '';
                res.on('data', (chunk) => {
                    rawData += chunk;
                });

                res.on('end', () => {
                    resolve(JSON.parse(rawData));
                });
            });

            req.on('error', (err: Error) => {
                reject(err);
            });
        });
    },
};
