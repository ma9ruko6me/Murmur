/* ==========================================================================
   data.js
   localStorageをDB代わりに使うデータ層。
   シードデータの投入、CRUD相当のヘルパー関数、現在ログイン中ユーザーの管理を行う。
   ========================================================================== */

const STORAGE_KEY = "murmur_prototype_db_v1";
const SESSION_KEY = "murmur_prototype_session_v1";
const MAX_POST_LENGTH = 280;
const MAX_IMAGES_PER_POST = 4;

const AVATAR_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9", "#8b5cf6"];

function avatarColorFor(userId) {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}

function nowIso() {
  return new Date().toISOString();
}

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

/* --------------------------------------------------------------------------
   シードデータ
   複数ユーザーが存在する前提(いいね・コメント・フォローが自分以外から行われる
   ケース)を再現するため、ダミーユーザー数名と、それらの間の投稿・コメント・
   いいね・フォロー関係をあらかじめ用意する。
   -------------------------------------------------------------------------- */
function buildSeedData() {
  const users = [
    {
      id: 1,
      username: "alice",
      displayName: "Alice",
      email: "alice@example.com",
      password: "password123",
      bio: "コーヒーとコードが好き。",
      createdAt: "2026-01-05T09:00:00.000Z",
    },
    {
      id: 2,
      username: "bob",
      displayName: "Bob",
      email: "bob@example.com",
      password: "password123",
      bio: "週末は写真を撮っています。",
      createdAt: "2026-01-06T09:00:00.000Z",
    },
    {
      id: 3,
      username: "carol",
      displayName: "Carol",
      email: "carol@example.com",
      password: "password123",
      bio: "猫と暮らしています🐈",
      createdAt: "2026-01-07T09:00:00.000Z",
    },
    {
      id: 4,
      username: "dave",
      displayName: "Dave",
      email: "dave@example.com",
      password: "password123",
      bio: "",
      createdAt: "2026-01-08T09:00:00.000Z",
    },
  ];

  const posts = [
    {
      id: 1,
      userId: 2,
      content: "今日は近所の公園で写真を撮ってきました。",
      images: ["placeholder:#0ea5e9:公園", "placeholder:#10b981:緑"],
      createdAt: "2026-08-20T01:00:00.000Z",
      updatedAt: "2026-08-20T01:00:00.000Z",
    },
    {
      id: 2,
      userId: 3,
      content: "うちの猫が箱に入りたがる理由を調べています。",
      images: ["placeholder:#f59e0b:猫"],
      createdAt: "2026-08-20T03:30:00.000Z",
      updatedAt: "2026-08-20T03:30:00.000Z",
    },
    {
      id: 3,
      userId: 1,
      content: "Murmurのプロトタイプを作り始めました。まずはタイムラインから。",
      images: [],
      createdAt: "2026-08-21T05:00:00.000Z",
      updatedAt: "2026-08-21T05:00:00.000Z",
    },
    {
      id: 4,
      userId: 4,
      content: "今日のランチはカレー。スパイスから作ると全然違う。",
      images: ["placeholder:#ec4899:カレー"],
      createdAt: "2026-08-21T08:15:00.000Z",
      updatedAt: "2026-08-21T08:15:00.000Z",
    },
    {
      id: 5,
      userId: 2,
      content: "夕焼けがきれいだったので思わず投稿。",
      images: ["placeholder:#8b5cf6:夕焼け", "placeholder:#f59e0b:空", "placeholder:#0ea5e9:海"],
      createdAt: "2026-08-22T10:00:00.000Z",
      updatedAt: "2026-08-22T10:00:00.000Z",
    },
  ];

  const comments = [
    {
      id: 1,
      postId: 1,
      userId: 3,
      parentCommentId: null,
      content: "いい写真ですね!どこの公園ですか?",
      createdAt: "2026-08-20T01:10:00.000Z",
      updatedAt: "2026-08-20T01:10:00.000Z",
    },
    {
      id: 2,
      postId: 1,
      userId: 2,
      parentCommentId: 1,
      content: "駅前の中央公園です。緑が多くて気持ちいいですよ。",
      createdAt: "2026-08-20T01:20:00.000Z",
      updatedAt: "2026-08-20T01:20:00.000Z",
    },
    {
      id: 3,
      postId: 1,
      userId: 1,
      parentCommentId: null,
      content: "今度行ってみます!",
      createdAt: "2026-08-20T02:00:00.000Z",
      updatedAt: "2026-08-20T02:00:00.000Z",
    },
    {
      id: 4,
      postId: 2,
      userId: 1,
      parentCommentId: null,
      content: "箱=安心できる狭い場所、らしいですよ🐈",
      createdAt: "2026-08-20T04:00:00.000Z",
      updatedAt: "2026-08-20T04:00:00.000Z",
    },
    {
      id: 5,
      postId: 2,
      userId: 3,
      parentCommentId: 4,
      content: "なるほど、勉強になります!",
      createdAt: "2026-08-20T04:10:00.000Z",
      updatedAt: "2026-08-20T04:10:00.000Z",
    },
  ];

  const likes = [
    { id: 1, postId: 1, userId: 1, createdAt: "2026-08-20T01:05:00.000Z" },
    { id: 2, postId: 1, userId: 3, createdAt: "2026-08-20T01:15:00.000Z" },
    { id: 3, postId: 2, userId: 1, createdAt: "2026-08-20T03:40:00.000Z" },
    { id: 4, postId: 4, userId: 1, createdAt: "2026-08-21T08:20:00.000Z" },
    { id: 5, postId: 5, userId: 3, createdAt: "2026-08-22T10:05:00.000Z" },
  ];

  const follows = [
    // alice(1)は bob(2)・carol(3) をフォロー
    { id: 1, followerId: 1, followeeId: 2, createdAt: "2026-01-10T00:00:00.000Z" },
    { id: 2, followerId: 1, followeeId: 3, createdAt: "2026-01-10T00:00:00.000Z" },
    // bob(2)は alice(1) をフォロー
    { id: 3, followerId: 2, followeeId: 1, createdAt: "2026-01-11T00:00:00.000Z" },
    // carol(3)は alice(1)・dave(4) をフォロー
    { id: 4, followerId: 3, followeeId: 1, createdAt: "2026-01-12T00:00:00.000Z" },
    { id: 5, followerId: 3, followeeId: 4, createdAt: "2026-01-12T00:00:00.000Z" },
  ];

  return { users, posts, comments, likes, follows };
}

function loadDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("破損したデータを検出したためシードデータで初期化します。", e);
    }
  }
  const seeded = buildSeedData();
  saveDb(seeded);
  return seeded;
}

function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

let db = loadDb();

function resetDb() {
  db = buildSeedData();
  saveDb(db);
}

/* --------------------------------------------------------------------------
   セッション(ログイン中ユーザー)
   -------------------------------------------------------------------------- */
function getCurrentUser() {
  const id = Number(sessionStorage.getItem(SESSION_KEY));
  if (!id) return null;
  return db.users.find((u) => u.id === id) || null;
}

function login(email, password) {
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) return null;
  sessionStorage.setItem(SESSION_KEY, String(user.id));
  return user;
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

function signup({ username, displayName, email, password }) {
  if (db.users.some((u) => u.username === username)) {
    throw new Error("そのユーザー名は既に使われています。");
  }
  if (db.users.some((u) => u.email === email)) {
    throw new Error("そのメールアドレスは既に登録されています。");
  }
  const user = {
    id: nextId(db.users),
    username,
    displayName,
    email,
    password,
    bio: "",
    createdAt: nowIso(),
  };
  db.users.push(user);
  saveDb(db);
  sessionStorage.setItem(SESSION_KEY, String(user.id));
  return user;
}

/* --------------------------------------------------------------------------
   ユーザー
   -------------------------------------------------------------------------- */
function getUserByUsername(username) {
  return db.users.find((u) => u.username === username) || null;
}

function getUserById(id) {
  return db.users.find((u) => u.id === id) || null;
}

function updateUserProfile(userId, { displayName, bio, avatarUrl }) {
  const user = getUserById(userId);
  if (!user) return null;
  user.displayName = displayName;
  user.bio = bio;
  user.avatarUrl = avatarUrl || null;
  saveDb(db);
  return user;
}

function searchUsers(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return db.users.filter(
    (u) => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)
  );
}

/* --------------------------------------------------------------------------
   フォロー
   -------------------------------------------------------------------------- */
function isFollowing(followerId, followeeId) {
  return db.follows.some((f) => f.followerId === followerId && f.followeeId === followeeId);
}

function follow(followerId, followeeId) {
  if (followerId === followeeId) return;
  if (isFollowing(followerId, followeeId)) return;
  db.follows.push({ id: nextId(db.follows), followerId, followeeId, createdAt: nowIso() });
  saveDb(db);
}

function unfollow(followerId, followeeId) {
  db.follows = db.follows.filter(
    (f) => !(f.followerId === followerId && f.followeeId === followeeId)
  );
  saveDb(db);
}

function getFollowing(userId) {
  return db.follows
    .filter((f) => f.followerId === userId)
    .map((f) => getUserById(f.followeeId))
    .filter(Boolean);
}

function getFollowers(userId) {
  return db.follows
    .filter((f) => f.followeeId === userId)
    .map((f) => getUserById(f.followerId))
    .filter(Boolean);
}

/* --------------------------------------------------------------------------
   投稿
   -------------------------------------------------------------------------- */
function getPostById(id) {
  return db.posts.find((p) => p.id === id) || null;
}

function getPostsByUser(userId) {
  return db.posts
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getTimeline(currentUserId) {
  const followingIds = new Set(getFollowing(currentUserId).map((u) => u.id));
  followingIds.add(currentUserId);
  return db.posts
    .filter((p) => followingIds.has(p.userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getAllPostsTimeline() {
  return [...db.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function createPost(userId, content, images) {
  const post = {
    id: nextId(db.posts),
    userId,
    content,
    images: images.slice(0, MAX_IMAGES_PER_POST),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.posts.push(post);
  saveDb(db);
  return post;
}

function updatePost(postId, content, images) {
  const post = getPostById(postId);
  if (!post) return null;
  post.content = content;
  post.images = images.slice(0, MAX_IMAGES_PER_POST);
  post.updatedAt = nowIso();
  saveDb(db);
  return post;
}

function deletePost(postId) {
  db.posts = db.posts.filter((p) => p.id !== postId);
  db.comments = db.comments.filter((c) => c.postId !== postId);
  db.likes = db.likes.filter((l) => l.postId !== postId);
  saveDb(db);
}

/* --------------------------------------------------------------------------
   いいね
   -------------------------------------------------------------------------- */
function hasLiked(postId, userId) {
  return db.likes.some((l) => l.postId === postId && l.userId === userId);
}

function getLikeCount(postId) {
  return db.likes.filter((l) => l.postId === postId).length;
}

function likePost(postId, userId) {
  if (hasLiked(postId, userId)) return;
  db.likes.push({ id: nextId(db.likes), postId, userId, createdAt: nowIso() });
  saveDb(db);
}

function unlikePost(postId, userId) {
  db.likes = db.likes.filter((l) => !(l.postId === postId && l.userId === userId));
  saveDb(db);
}

/* --------------------------------------------------------------------------
   コメント(階層構造)
   -------------------------------------------------------------------------- */
function getCommentsByPost(postId) {
  return db.comments.filter((c) => c.postId === postId);
}

function getCommentCount(postId) {
  return getCommentsByPost(postId).length;
}

function buildCommentTree(postId) {
  const comments = getCommentsByPost(postId).sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  const byId = new Map(comments.map((c) => [c.id, { ...c, children: [] }]));
  const roots = [];
  byId.forEach((node) => {
    if (node.parentCommentId && byId.has(node.parentCommentId)) {
      byId.get(node.parentCommentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function createComment(postId, userId, content, parentCommentId) {
  const comment = {
    id: nextId(db.comments),
    postId,
    userId,
    parentCommentId: parentCommentId || null,
    content,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.comments.push(comment);
  saveDb(db);
  return comment;
}

function updateComment(commentId, content) {
  const comment = db.comments.find((c) => c.id === commentId);
  if (!comment) return null;
  comment.content = content;
  comment.updatedAt = nowIso();
  saveDb(db);
  return comment;
}

function deleteComment(commentId) {
  const idsToDelete = new Set([commentId]);
  let changed = true;
  while (changed) {
    changed = false;
    db.comments.forEach((c) => {
      if (c.parentCommentId && idsToDelete.has(c.parentCommentId) && !idsToDelete.has(c.id)) {
        idsToDelete.add(c.id);
        changed = true;
      }
    });
  }
  db.comments = db.comments.filter((c) => !idsToDelete.has(c.id));
  saveDb(db);
}

/* --------------------------------------------------------------------------
   コメント検索
   -------------------------------------------------------------------------- */
function searchComments(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return db.comments
    .filter((c) => c.content.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
