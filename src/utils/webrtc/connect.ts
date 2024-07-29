import { Peer } from "peerjs";

export function createPeer(uid: string) {
    const peer = new Peer(uid);
    return peer;
}
