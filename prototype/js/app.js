/* ==========================================================================
   app.js
   各画面のレンダリングとイベントハンドリング。
   ========================================================================== */

const view = document.getElementById("view");
const navEl = document.getElementById("nav");

/* --------------------------------------------------------------------------
   共通ヘルパー
   -------------------------------------------------------------------------- */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(displayName) {
  return (displayName || "?").trim().charAt(0).toUpperCase();
}

function avatarHtml(user, size = "md") {
  if (!user) return `<div class="avatar avatar-${size}" style="background:#94a3b8">?</div>`;
  if (user.avatarUrl) {
    return `<img class="avatar avatar-${size}" src="${user.avatarUrl}" alt="${escapeHtml(user.displayName)}のアイコン" />`;
  }
  return `<div class="avatar avatar-${size}" style="background:${avatarColorFor(user.id)}">${escapeHtml(
    initials(user.displayName)
  )}</div>`;
}

function userLink(user) {
  return `<a class="user-link" href="#/profile/${encodeURIComponent(user.username)}">
    ${avatarHtml(user, "sm")}
    <span class="user-link-name">
      <strong>${escapeHtml(user.displayName)}</strong>
      <span class="user-handle">@${escapeHtml(user.username)}</span>
    </span>
  </a>`;
}

/** 画像文字列を<img>またはプレースホルダーdivのHTMLに変換する。
 *  シードデータは "placeholder:#色:ラベル" 形式、アップロード画像は data URL。 */
function imageHtml(image) {
  if (image.startsWith("placeholder:")) {
    const [, color, label] = image.split(":");
    return `<div class="post-image placeholder-image" style="background:${escapeHtml(
      color
    )}">${escapeHtml(label || "")}</div>`;
  }
  return `<img class="post-image" src="${image}" alt="投稿画像" />`;
}

function setText(el, text) {
  el.textContent = text;
}

/* --------------------------------------------------------------------------
   ナビゲーション
   -------------------------------------------------------------------------- */
function renderNav(currentUser) {
  if (!currentUser) {
    navEl.innerHTML = "";
    navEl.classList.add("hidden");
    return;
  }
  navEl.classList.remove("hidden");
  navEl.innerHTML = `
    <nav class="navbar">
      <a class="brand" href="#/timeline">Murmur</a>
      <form class="nav-search" id="nav-search-form">
        <input type="search" name="q" placeholder="ユーザー・コメントを検索" id="nav-search-input" />
      </form>
      <div class="nav-actions">
        <a href="#/timeline" class="nav-link">タイムライン</a>
        <a href="#/profile/${encodeURIComponent(currentUser.username)}" class="nav-link">
          ${avatarHtml(currentUser, "sm")} ${escapeHtml(currentUser.displayName)}
        </a>
        <button type="button" class="secondary-button" id="nav-logout">ログアウト</button>
      </div>
    </nav>
  `;
  document.getElementById("nav-search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("nav-search-input").value;
    navigate(`/search?q=${encodeURIComponent(q)}&type=users`);
  });
  document.getElementById("nav-logout").addEventListener("click", () => {
    logout();
    navigate("/login");
  });
}

/* --------------------------------------------------------------------------
   認証画面
   -------------------------------------------------------------------------- */
function renderLogin() {
  view.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="brand-title">Murmur</h1>
        <p class="auth-hint">
          デモ用アカウント: alice@example.com / password123（他 bob, carol, dave も同パスワード）
        </p>
        <form id="login-form">
          <label>メールアドレス
            <input type="email" name="email" required autocomplete="email" />
          </label>
          <label>パスワード
            <input type="password" name="password" required autocomplete="current-password" />
          </label>
          <p class="form-error hidden" id="login-error"></p>
          <button type="submit" class="primary-button full-width">ログイン</button>
        </form>
        <p class="auth-switch">アカウントをお持ちでない方は <a href="#/signup">サインアップ</a></p>
      </div>
    </div>
  `;
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const user = login(form.get("email").trim(), form.get("password"));
    if (!user) {
      const err = document.getElementById("login-error");
      err.textContent = "メールアドレスまたはパスワードが正しくありません。";
      err.classList.remove("hidden");
      return;
    }
    navigate("/timeline");
  });
}

function renderSignup() {
  view.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="brand-title">Murmur</h1>
        <form id="signup-form">
          <label>ユーザー名
            <input type="text" name="username" required pattern="[A-Za-z0-9_]+" maxlength="50" />
          </label>
          <label>表示名
            <input type="text" name="displayName" required maxlength="50" />
          </label>
          <label>メールアドレス
            <input type="email" name="email" required autocomplete="email" />
          </label>
          <label>パスワード
            <input type="password" name="password" required minlength="8" autocomplete="new-password" />
          </label>
          <p class="form-hint">パスワードはこのブラウザ内のみに保存される学習用ダミーです。実際のパスワードは入力しないでください。</p>
          <p class="form-error hidden" id="signup-error"></p>
          <button type="submit" class="primary-button full-width">サインアップ</button>
        </form>
        <p class="auth-switch">アカウントをお持ちの方は <a href="#/login">ログイン</a></p>
      </div>
    </div>
  `;
  document.getElementById("signup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      signup({
        username: form.get("username").trim(),
        displayName: form.get("displayName").trim(),
        email: form.get("email").trim(),
        password: form.get("password"),
      });
      navigate("/timeline");
    } catch (err) {
      const errEl = document.getElementById("signup-error");
      errEl.textContent = err.message;
      errEl.classList.remove("hidden");
    }
  });
}

/* --------------------------------------------------------------------------
   投稿カード(タイムライン・プロフィールで共用)
   -------------------------------------------------------------------------- */
function postCardHtml(post, currentUser) {
  const author = getUserById(post.userId);
  const liked = hasLiked(post.id, currentUser.id);
  const likeCount = getLikeCount(post.id);
  const commentCount = getCommentCount(post.id);
  const isOwn = author.id === currentUser.id;

  return `
    <article class="post-card" data-post-id="${post.id}">
      <div class="post-card-header">
        ${userLink(author)}
        <span class="post-date">${formatDate(post.createdAt)}</span>
      </div>
      <a class="post-content-link" href="#/post/${post.id}">
        <p class="post-content">${escapeHtml(post.content)}</p>
        ${post.images.length ? `<div class="post-images post-images-${post.images.length}">${post.images.map(imageHtml).join("")}</div>` : ""}
      </a>
      <div class="post-card-actions">
        <button type="button" class="like-button ${liked ? "liked" : ""}" data-action="toggle-like" data-post-id="${post.id}">
          ${liked ? "♥" : "♡"} <span>${likeCount}</span>
        </button>
        <a class="comment-count-link" href="#/post/${post.id}">💬 <span>${commentCount}</span></a>
        ${
          isOwn
            ? `<button type="button" class="text-button" data-action="edit-post" data-post-id="${post.id}">編集</button>
               <button type="button" class="text-button danger-text" data-action="delete-post" data-post-id="${post.id}">削除</button>`
            : ""
        }
      </div>
    </article>
  `;
}

function bindPostCardEvents(container, currentUser) {
  container.querySelectorAll('[data-action="toggle-like"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const postId = Number(btn.dataset.postId);
      if (hasLiked(postId, currentUser.id)) {
        unlikePost(postId, currentUser.id);
      } else {
        likePost(postId, currentUser.id);
      }
      handleRoute();
    });
  });
  container.querySelectorAll('[data-action="edit-post"]').forEach((btn) => {
    btn.addEventListener("click", () => openPostModal(Number(btn.dataset.postId)));
  });
  container.querySelectorAll('[data-action="delete-post"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const postId = Number(btn.dataset.postId);
      openConfirmDialog("この投稿を削除しますか?コメント・いいねも削除されます。", () => {
        deletePost(postId);
        navigate("/timeline");
      });
    });
  });
}

/* --------------------------------------------------------------------------
   タイムライン
   -------------------------------------------------------------------------- */
function renderTimeline(scope) {
  const currentUser = getCurrentUser();
  const posts = scope === "all" ? getAllPostsTimeline() : getTimeline(currentUser.id);
  view.innerHTML = `
    <div class="page-container">
      <div class="page-header">
        <h1>タイムライン</h1>
        <button type="button" class="primary-button" id="open-new-post">投稿する</button>
      </div>
      <div class="search-tabs">
        <button type="button" class="tab-button ${scope === "following" ? "active" : ""}" data-scope="following">フォロー中</button>
        <button type="button" class="tab-button ${scope === "all" ? "active" : ""}" data-scope="all">すべて</button>
      </div>
      <div class="post-list">
        ${
          posts.length
            ? posts.map((p) => postCardHtml(p, currentUser)).join("")
            : `<p class="empty-state">${
                scope === "all"
                  ? "まだ投稿がありません。"
                  : "まだ投稿がありません。フォローするか、最初の投稿をしてみましょう。"
              }</p>`
        }
      </div>
    </div>
  `;
  document.getElementById("open-new-post").addEventListener("click", () => openPostModal(null));
  view.querySelectorAll(".tab-button").forEach((btn) => {
    btn.addEventListener("click", () => navigate(`/timeline?scope=${btn.dataset.scope}`));
  });
  bindPostCardEvents(view, currentUser);
}

/* --------------------------------------------------------------------------
   投稿作成・編集モーダル
   -------------------------------------------------------------------------- */
const postModal = document.getElementById("post-modal");
const postForm = document.getElementById("post-form");
const postContentInput = document.getElementById("post-content");
const postCharCount = document.getElementById("post-char-count");
const postImageInput = document.getElementById("post-image-input");
const postImagePreviews = document.getElementById("post-image-previews");

let modalState = { editingPostId: null, images: [] };

function openPostModal(postId) {
  modalState = { editingPostId: postId, images: [] };
  const title = document.getElementById("post-modal-title");
  if (postId) {
    const post = getPostById(postId);
    title.textContent = "投稿を編集";
    postContentInput.value = post.content;
    modalState.images = [...post.images];
  } else {
    title.textContent = "投稿する";
    postContentInput.value = "";
  }
  updateCharCount();
  renderImagePreviews();
  postModal.classList.remove("hidden");
  postContentInput.focus();
}

function closePostModal() {
  postModal.classList.add("hidden");
  postForm.reset();
}

function updateCharCount() {
  postCharCount.textContent = `${postContentInput.value.length} / ${MAX_POST_LENGTH}`;
}

function renderImagePreviews() {
  postImagePreviews.innerHTML = modalState.images
    .map(
      (img, i) => `
      <div class="image-preview-item">
        ${imageHtml(img)}
        <button type="button" class="remove-image-button" data-index="${i}" aria-label="画像を削除">✕</button>
      </div>`
    )
    .join("");
  postImagePreviews.querySelectorAll(".remove-image-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      modalState.images.splice(Number(btn.dataset.index), 1);
      renderImagePreviews();
    });
  });
}

postContentInput.addEventListener("input", updateCharCount);

document.getElementById("post-modal-close").addEventListener("click", closePostModal);
postModal.addEventListener("click", (e) => {
  if (e.target === postModal) closePostModal();
});

postImageInput.addEventListener("change", () => {
  const remaining = MAX_IMAGES_PER_POST - modalState.images.length;
  const files = Array.from(postImageInput.files).slice(0, Math.max(remaining, 0));
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      modalState.images.push(reader.result);
      renderImagePreviews();
    };
    reader.readAsDataURL(file);
  });
  postImageInput.value = "";
});

postForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const currentUser = getCurrentUser();
  const content = postContentInput.value.trim();
  if (!content) return;
  if (modalState.editingPostId) {
    updatePost(modalState.editingPostId, content, modalState.images);
  } else {
    createPost(currentUser.id, content, modalState.images);
  }
  closePostModal();
  handleRoute();
});

/* --------------------------------------------------------------------------
   確認ダイアログ
   -------------------------------------------------------------------------- */
const confirmDialog = document.getElementById("confirm-dialog");
const confirmDialogMessage = document.getElementById("confirm-dialog-message");
let confirmDialogCallback = null;

function openConfirmDialog(message, onConfirm) {
  confirmDialogMessage.textContent = message;
  confirmDialogCallback = onConfirm;
  confirmDialog.classList.remove("hidden");
}

function closeConfirmDialog() {
  confirmDialog.classList.add("hidden");
  confirmDialogCallback = null;
}

document.getElementById("confirm-dialog-cancel").addEventListener("click", closeConfirmDialog);
document.getElementById("confirm-dialog-ok").addEventListener("click", () => {
  if (confirmDialogCallback) confirmDialogCallback();
  closeConfirmDialog();
});
confirmDialog.addEventListener("click", (e) => {
  if (e.target === confirmDialog) closeConfirmDialog();
});

/* --------------------------------------------------------------------------
   投稿詳細・コメントスレッド
   -------------------------------------------------------------------------- */
function commentNodeHtml(node, currentUser) {
  const author = getUserById(node.userId);
  const isOwn = author.id === currentUser.id;
  return `
    <li class="comment" data-comment-id="${node.id}">
      <div class="comment-body">
        <div class="comment-header">
          ${userLink(author)}
          <span class="post-date">${formatDate(node.createdAt)}</span>
        </div>
        <p class="comment-content" data-role="comment-content">${escapeHtml(node.content)}</p>
        <div class="comment-edit-form hidden" data-role="comment-edit-form">
          <textarea maxlength="280">${escapeHtml(node.content)}</textarea>
          <div class="comment-edit-actions">
            <button type="button" class="text-button" data-action="cancel-edit-comment" data-comment-id="${node.id}">キャンセル</button>
            <button type="button" class="primary-button small" data-action="save-edit-comment" data-comment-id="${node.id}">保存</button>
          </div>
        </div>
        <div class="comment-actions">
          <button type="button" class="text-button" data-action="toggle-reply" data-comment-id="${node.id}">返信</button>
          ${
            isOwn
              ? `<button type="button" class="text-button" data-action="edit-comment" data-comment-id="${node.id}">編集</button>
                 <button type="button" class="text-button danger-text" data-action="delete-comment" data-comment-id="${node.id}">削除</button>`
              : ""
          }
        </div>
        <form class="reply-form hidden" data-role="reply-form" data-parent-id="${node.id}">
          <textarea maxlength="280" placeholder="返信を入力"></textarea>
          <button type="submit" class="primary-button small">返信する</button>
        </form>
      </div>
      ${
        node.children.length
          ? `<ul class="comment-children">${node.children
              .map((child) => commentNodeHtml(child, currentUser))
              .join("")}</ul>`
          : ""
      }
    </li>
  `;
}

function bindCommentEvents(container, postId, currentUser) {
  container.querySelectorAll('[data-role="reply-form"]').forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const textarea = form.querySelector("textarea");
      const content = textarea.value.trim();
      if (!content) return;
      createComment(postId, currentUser.id, content, Number(form.dataset.parentId));
      renderPostDetail(postId);
    });
  });

  container.querySelectorAll('[data-action="toggle-reply"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const li = btn.closest(".comment");
      li.querySelector('[data-role="reply-form"]').classList.toggle("hidden");
    });
  });

  container.querySelectorAll('[data-action="edit-comment"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const li = btn.closest(".comment");
      li.querySelector('[data-role="comment-content"]').classList.add("hidden");
      li.querySelector('[data-role="comment-edit-form"]').classList.remove("hidden");
    });
  });

  container.querySelectorAll('[data-action="cancel-edit-comment"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const li = btn.closest(".comment");
      li.querySelector('[data-role="comment-content"]').classList.remove("hidden");
      li.querySelector('[data-role="comment-edit-form"]').classList.add("hidden");
    });
  });

  container.querySelectorAll('[data-action="save-edit-comment"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const li = btn.closest(".comment");
      const textarea = li.querySelector('[data-role="comment-edit-form"] textarea');
      const content = textarea.value.trim();
      if (!content) return;
      updateComment(Number(btn.dataset.commentId), content);
      renderPostDetail(postId);
    });
  });

  container.querySelectorAll('[data-action="delete-comment"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const commentId = Number(btn.dataset.commentId);
      openConfirmDialog("このコメントを削除しますか?返信も合わせて削除されます。", () => {
        deleteComment(commentId);
        renderPostDetail(postId);
      });
    });
  });
}

function renderPostDetail(postId) {
  const currentUser = getCurrentUser();
  const post = getPostById(postId);
  if (!post) {
    view.innerHTML = `<div class="page-container"><p class="empty-state">投稿が見つかりませんでした。</p></div>`;
    return;
  }
  const author = getUserById(post.userId);
  const liked = hasLiked(post.id, currentUser.id);
  const likeCount = getLikeCount(post.id);
  const isOwn = author.id === currentUser.id;
  const commentTree = buildCommentTree(post.id);

  view.innerHTML = `
    <div class="page-container">
      <a href="#/timeline" class="back-link">← タイムラインに戻る</a>
      <article class="post-card post-detail">
        <div class="post-card-header">
          ${userLink(author)}
          <span class="post-date">${formatDate(post.createdAt)}</span>
        </div>
        <p class="post-content">${escapeHtml(post.content)}</p>
        ${post.images.length ? `<div class="post-images post-images-${post.images.length}">${post.images.map(imageHtml).join("")}</div>` : ""}
        <div class="post-card-actions">
          <button type="button" class="like-button ${liked ? "liked" : ""}" data-action="toggle-like" data-post-id="${post.id}">
            ${liked ? "♥" : "♡"} <span>${likeCount}</span>
          </button>
          <span class="comment-count-link">💬 <span>${getCommentCount(post.id)}</span></span>
          ${
            isOwn
              ? `<button type="button" class="text-button" data-action="edit-post" data-post-id="${post.id}">編集</button>
                 <button type="button" class="text-button danger-text" data-action="delete-post" data-post-id="${post.id}">削除</button>`
              : ""
          }
        </div>
      </article>

      <section class="comments-section">
        <h2>コメント</h2>
        <form id="new-comment-form" class="reply-form">
          <textarea maxlength="280" placeholder="コメントを入力" id="new-comment-textarea"></textarea>
          <button type="submit" class="primary-button small">コメントする</button>
        </form>
        <ul class="comment-list">
          ${
            commentTree.length
              ? commentTree.map((n) => commentNodeHtml(n, currentUser)).join("")
              : `<p class="empty-state">まだコメントがありません。</p>`
          }
        </ul>
      </section>
    </div>
  `;

  bindPostCardEvents(view, currentUser);
  bindCommentEvents(view, postId, currentUser);

  document.getElementById("new-comment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const textarea = document.getElementById("new-comment-textarea");
    const content = textarea.value.trim();
    if (!content) return;
    createComment(postId, currentUser.id, content, null);
    renderPostDetail(postId);
  });
}

/* --------------------------------------------------------------------------
   プロフィール
   -------------------------------------------------------------------------- */
function renderProfile(username) {
  const currentUser = getCurrentUser();
  const user = getUserByUsername(username);
  if (!user) {
    view.innerHTML = `<div class="page-container"><p class="empty-state">ユーザーが見つかりませんでした。</p></div>`;
    return;
  }
  const posts = getPostsByUser(user.id);
  const followingCount = getFollowing(user.id).length;
  const followerCount = getFollowers(user.id).length;
  const isOwn = user.id === currentUser.id;
  const following = isFollowing(currentUser.id, user.id);

  view.innerHTML = `
    <div class="page-container">
      <section class="profile-header">
        ${avatarHtml(user, "lg")}
        <div class="profile-info">
          <h1>${escapeHtml(user.displayName)}</h1>
          <p class="user-handle">@${escapeHtml(user.username)}</p>
          ${user.bio ? `<p class="profile-bio">${escapeHtml(user.bio)}</p>` : ""}
          <div class="profile-stats">
            <a href="#/profile/${encodeURIComponent(user.username)}/following"><strong>${followingCount}</strong> フォロー中</a>
            <a href="#/profile/${encodeURIComponent(user.username)}/followers"><strong>${followerCount}</strong> フォロワー</a>
          </div>
        </div>
        ${
          isOwn
            ? `<button type="button" class="secondary-button" id="edit-profile-button">プロフィールを編集</button>`
            : `<button type="button" class="${following ? "secondary-button" : "primary-button"}" id="follow-toggle-button">
                 ${following ? "フォロー解除" : "フォローする"}
               </button>`
        }
      </section>
      <div class="post-list">
        ${
          posts.length
            ? posts.map((p) => postCardHtml(p, currentUser)).join("")
            : `<p class="empty-state">まだ投稿がありません。</p>`
        }
      </div>
    </div>
  `;

  bindPostCardEvents(view, currentUser);

  const followBtn = document.getElementById("follow-toggle-button");
  if (followBtn) {
    followBtn.addEventListener("click", () => {
      if (isFollowing(currentUser.id, user.id)) {
        unfollow(currentUser.id, user.id);
      } else {
        follow(currentUser.id, user.id);
      }
      renderProfile(username);
    });
  }

  const editProfileBtn = document.getElementById("edit-profile-button");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => openProfileModal(user));
  }
}

/* --------------------------------------------------------------------------
   プロフィール編集モーダル
   -------------------------------------------------------------------------- */
const profileModal = document.getElementById("profile-modal");
const profileForm = document.getElementById("profile-form");
const profileDisplayNameInput = document.getElementById("profile-display-name");
const profileBioInput = document.getElementById("profile-bio");
const profileAvatarInput = document.getElementById("profile-avatar-input");
const profileAvatarPreview = document.getElementById("profile-avatar-preview");

let profileModalState = { userId: null, avatarUrl: null };

function openProfileModal(user) {
  profileModalState = { userId: user.id, avatarUrl: user.avatarUrl || null };
  profileDisplayNameInput.value = user.displayName;
  profileBioInput.value = user.bio || "";
  renderProfileAvatarPreview(user);
  profileModal.classList.remove("hidden");
  profileDisplayNameInput.focus();
}

function closeProfileModal() {
  profileModal.classList.add("hidden");
  profileForm.reset();
}

function renderProfileAvatarPreview(user) {
  const previewUser = { ...user, avatarUrl: profileModalState.avatarUrl };
  profileAvatarPreview.innerHTML = avatarHtml(previewUser, "lg");
}

document.getElementById("profile-modal-close").addEventListener("click", closeProfileModal);
profileModal.addEventListener("click", (e) => {
  if (e.target === profileModal) closeProfileModal();
});

profileAvatarInput.addEventListener("change", () => {
  const file = profileAvatarInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    profileModalState.avatarUrl = reader.result;
    renderProfileAvatarPreview(getUserById(profileModalState.userId));
  };
  reader.readAsDataURL(file);
  profileAvatarInput.value = "";
});

profileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const updated = updateUserProfile(profileModalState.userId, {
    displayName: profileDisplayNameInput.value.trim(),
    bio: profileBioInput.value.trim(),
    avatarUrl: profileModalState.avatarUrl,
  });
  closeProfileModal();
  navigate(`/profile/${encodeURIComponent(updated.username)}`);
  handleRoute();
});

/* --------------------------------------------------------------------------
   フォロー中・フォロワー一覧
   -------------------------------------------------------------------------- */
function renderFollowList(username, type) {
  const user = getUserByUsername(username);
  if (!user) {
    view.innerHTML = `<div class="page-container"><p class="empty-state">ユーザーが見つかりませんでした。</p></div>`;
    return;
  }
  const list = type === "following" ? getFollowing(user.id) : getFollowers(user.id);
  const title = type === "following" ? "フォロー中" : "フォロワー";

  view.innerHTML = `
    <div class="page-container">
      <a href="#/profile/${encodeURIComponent(user.username)}" class="back-link">← ${escapeHtml(user.displayName)}のプロフィールに戻る</a>
      <h1>${escapeHtml(user.displayName)}の${title}</h1>
      <ul class="user-list">
        ${
          list.length
            ? list.map((u) => `<li>${userLink(u)}</li>`).join("")
            : `<p class="empty-state">${title}はいません。</p>`
        }
      </ul>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   検索
   -------------------------------------------------------------------------- */
function renderSearch(query, type) {
  const activeType = type === "comments" ? "comments" : "users";
  const userResults = activeType === "users" ? searchUsers(query) : [];
  const commentResults = activeType === "comments" ? searchComments(query) : [];

  view.innerHTML = `
    <div class="page-container">
      <h1>検索</h1>
      <form id="search-form" class="search-form">
        <input type="search" name="q" value="${escapeHtml(query)}" placeholder="キーワードを入力" />
        <button type="submit" class="primary-button">検索</button>
      </form>
      <div class="search-tabs">
        <button type="button" class="tab-button ${activeType === "users" ? "active" : ""}" data-type="users">ユーザー</button>
        <button type="button" class="tab-button ${activeType === "comments" ? "active" : ""}" data-type="comments">コメント</button>
      </div>
      <div class="search-results">
        ${
          activeType === "users"
            ? userResults.length
              ? `<ul class="user-list">${userResults.map((u) => `<li>${userLink(u)}</li>`).join("")}</ul>`
              : query
              ? `<p class="empty-state">「${escapeHtml(query)}」に一致するユーザーは見つかりませんでした。</p>`
              : `<p class="empty-state">ユーザー名または表示名で検索できます。</p>`
            : commentResults.length
            ? `<ul class="comment-search-list">${commentResults
                .map((c) => {
                  const author = getUserById(c.userId);
                  return `<li>
                      <a class="comment-search-item" href="#/post/${c.postId}">
                        ${userLink(author)}
                        <p class="comment-content">${escapeHtml(c.content)}</p>
                        <span class="post-date">${formatDate(c.createdAt)}</span>
                      </a>
                    </li>`;
                })
                .join("")}</ul>`
            : query
            ? `<p class="empty-state">「${escapeHtml(query)}」に一致するコメントは見つかりませんでした。</p>`
            : `<p class="empty-state">コメント本文のキーワードで検索できます。</p>`
        }
      </div>
    </div>
  `;

  document.getElementById("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = new FormData(e.target).get("q");
    navigate(`/search?q=${encodeURIComponent(q)}&type=${activeType}`);
  });
  view.querySelectorAll(".tab-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigate(`/search?q=${encodeURIComponent(query)}&type=${btn.dataset.type}`);
    });
  });
}
