/**
 * Stand-in friends for the invite panel.
 *
 * There is no friends entity on the backend — no list, no requests, no
 * relationship of any kind between two accounts — so the rows this feeds are
 * inert and marked as such. It exists to give the panel its real shape now, so
 * that wiring the feature later moves the rows rather than inventing them.
 *
 * Croatian names, because the table these sit around is a bela table.
 */
export type MockFriend = {
    id: string;
    username: string;
    online: boolean;
};

export const mockFriends: MockFriend[] = [
    { id: "1", username: "Ivana", online: true },
    { id: "2", username: "Marko", online: true },
    { id: "3", username: "Petra", online: true },
    { id: "4", username: "Tomislav", online: false },
    { id: "5", username: "Lucija", online: false },
];
