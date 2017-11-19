import {Inject, Service} from 'typedi';
import { Repository } from 'typeorm';
import { Room } from '../entities/Room';
import { Video } from '../entities/Video';
import { YoutubeService } from './YoutubeService';
import { User } from '../entities/User';

@Service()
export class RoomService {
    public static INVALID_INFO_ERROR = 'ROOM_INVALID_INFO';
    public static ALREADY_EXISTS_ERROR = 'ROOM_ALREADY_EXISTS';
    public static NOT_FOUND_ERROR = 'ROOM_NOT_FOUND';
    public static INVALID_YOUTUBE_ID_ERROR = 'INVALID_YOUTUBE_ID';
    public static VIDEO_ALREADY_ADDED_ERROR = 'VIDEO_ALREADY_ADDED';
    public static VIDEO_NOT_FOUND_ERROR = 'VIDEO_NOT_FOUND';
    public static PLAYLIST_INVALID_INFO_ERROR = 'PLAYLIST_INVALID_INFO'
    public static USER_ALREADY_JOINED_ERROR = 'USER_ALREADY_JOINED';

    @Inject('UserRepository')
    userRepository: Repository<User>;

    @Inject('RoomRepository')
    roomRepository: Repository<Room>;

    @Inject('VideoRepository')
    videoRepository: Repository<Video>;

    @Inject()
    youtubeService: YoutubeService;

    // TODO decouple socket from business logic
    @Inject('io')
    io: SocketIO.Server;

    async createRoom(name: string, playing = false): Promise<Room> {
        if (!name) {
            throw new Error(RoomService.INVALID_INFO_ERROR);
        }

        const sameNameRoom = await this.roomRepository.findOne({ name: name });
        if (sameNameRoom) {
            throw new Error(RoomService.ALREADY_EXISTS_ERROR);
        }
        const room = new Room();
        room.name = name;
        room.playing = playing;
        return this.roomRepository.save(room);
    }

    getRooms(): Promise<Room[]> {
        return this.roomRepository.find();
    }

    async getRoom(id: string | number): Promise<Room> {
        const room = await this.roomRepository.findOneById(id);
        if (!room) {
            throw new Error(RoomService.NOT_FOUND_ERROR);
        }
        return room;
    }

    async removeRoom(id: string | number) {
        const room = await this.roomRepository.findOneById(id);
        if (!room) {
            throw new Error(RoomService.NOT_FOUND_ERROR);
        }
        await this.videoRepository.remove(room.videos);
        await this.roomRepository.remove(room);
    }

    async addVideo(id: string | number, youtubeId: string): Promise<Video> {
        if (!youtubeId) {
            throw new Error(RoomService.INVALID_YOUTUBE_ID_ERROR);
        }
        const title = await this.youtubeService.getVideoTitle(youtubeId);
        if (!title) {
            throw new Error(RoomService.INVALID_YOUTUBE_ID_ERROR);
        }

        const room = await this.roomRepository.findOneById(id);
        if (!room) {
            throw new Error(RoomService.NOT_FOUND_ERROR);
        }

        const alreadyAdded = !!room.videos.find((video) => youtubeId === video.youtubeId);
        if (alreadyAdded) {
            throw new Error(RoomService.VIDEO_ALREADY_ADDED_ERROR);
        }

        const video = new Video();
        video.title = title;
        video.youtubeId = youtubeId;
        if (!room.videos.length) {
            video.startedPlayed = new Date().toISOString();
        }
        const storedVideo = await this.videoRepository.save(video);
        room.videos.push(storedVideo);
        if (!room.currentVideoId) {
            room.currentVideoId = storedVideo.id;
        }
        await this.roomRepository.save(room);
        this.io.to(`room n${room.id}`).emit('video added', storedVideo);
        return storedVideo;
    }

    async removeVideo(roomId: number | string, videoId: number | string): Promise<Room> {
        if (!roomId || !videoId) {
            throw new Error(RoomService.INVALID_INFO_ERROR);
        }

        // TODO find a way of how to do this with the repository object
        const room = await this.roomRepository.createQueryBuilder('room').where('room.id = :id', { id: roomId }).leftJoinAndSelect('room.users', 'users').leftJoinAndSelect('room.videos', 'videos').getOne();
        const video = await this.videoRepository.findOneById(videoId);
        if (!room) {
            throw new Error(RoomService.NOT_FOUND_ERROR);
        }
        if (!video) {
            throw new Error(RoomService.VIDEO_NOT_FOUND_ERROR);
        }

        room.videos = room.videos.filter((video) => video.id !== +videoId);
        if (!room.videos.length) {
            room.currentVideoId = null;
        }
        this.io.to(`room n${room.id}`).emit('video deleted', video);
        await this.roomRepository.save(room);
        await this.videoRepository.remove(video);
        return room;
    }

    async importPlaylist(id: number | string, playlistId: string): Promise<Room> {
        if (!playlistId) {
            throw new Error(RoomService.PLAYLIST_INVALID_INFO_ERROR);
        }
        const room = await this.roomRepository.findOneById(id);
        if (!room) {
            throw new Error(RoomService.NOT_FOUND_ERROR);
        }

        const videosInfo = await this.youtubeService.getVideoInfoFromPlaylist(playlistId);
        if (!videosInfo) {
            throw new Error(RoomService.PLAYLIST_INVALID_INFO_ERROR);
        }

        const videos = videosInfo.map((videoInfo) => {
            const video = new Video();
            video.youtubeId = videoInfo.youtubeId;
            video.title = videoInfo.title;
            return video;
        });
        const storedVideos = await this.videoRepository.save(videos);
        room.videos = room.videos.concat(storedVideos);
        const storedRoom = await this.roomRepository.save(room);
        storedVideos.forEach((video) => this.io.to(`room n${storedRoom.id}`).emit('video added', video));
        return storedRoom;
    }

    async getRoomUsers(id: number | string): Promise<User[]> {
        // TODO find a way of how to do this with the repository object
        const room = await this.roomRepository.createQueryBuilder('room').where('room.id = :id', { id }).innerJoinAndSelect('room.users', 'users').getOne();
        if (!room) {
            throw new Error(RoomService.NOT_FOUND_ERROR);
        }
        return room.users;
    }

    async joinRoom(id: number | string, userJoiningRoom: number | string | User): Promise<void> {
        // TODO find a way of how to do this with the repository object
        const room = await this.roomRepository.createQueryBuilder('room').where('room.id = :id', { id }).leftJoinAndSelect('room.users', 'users').getOne();
        if (!room) {
            throw new Error(RoomService.NOT_FOUND_ERROR);
        }
        let user: User;
        if (typeof userJoiningRoom === 'number' || typeof userJoiningRoom === 'string') {
            user = await this.userRepository.findOneById(user);
        } else {
            user = userJoiningRoom;
        }
        const alreadyJoined = !!room.users.find((userRoom) => userRoom.id === user.id);
        if (alreadyJoined) {
            throw new Error(RoomService.USER_ALREADY_JOINED_ERROR);
        }
        room.users.push(user);
        this.roomRepository.save(room);
    }
}
