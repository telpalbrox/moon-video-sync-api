import {Inject} from 'typedi';
import * as axiosImported from 'axios';
import {AxiosStatic} from 'axios';

const axios: AxiosStatic = (axiosImported as any);

@Inject()
export class YoutubeService {
    private googleKey: string;
    private baseUrl: string;

    constructor() {
        this.googleKey = process.env.GOOGLE_KEY;
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    }

    async getVideoTitle(youtubeId: string) {
        try {
            const response = await axios.get(`${this.baseUrl}/videos`, {
                params: {
                    id: youtubeId,
                    key: this.googleKey,
                    part: 'snippet'
                }
            });
            if (!response.data.items[0]) {
                return null;
            }
            return response.data.items[0].snippet.title;
        } catch (err) {
            console.error(err);
            return null;
        }
    }
}
