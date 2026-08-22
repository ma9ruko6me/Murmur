/* ==========================================================================
   router.js
   hashベースの簡易ルーター。
   ========================================================================== */

const PUBLIC_ROUTES = ["login", "signup"];

function parseHash() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [path, queryString] = hash.split("?");
  const segments = path.split("/").filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryString || ""));
  return { segments, query };
}

function navigate(path) {
  location.hash = path;
}

function handleRoute() {
  const { segments, query } = parseHash();
  const name = segments[0] || "timeline";
  const currentUser = getCurrentUser();

  if (!currentUser && !PUBLIC_ROUTES.includes(name)) {
    navigate("/login");
    return;
  }
  if (currentUser && PUBLIC_ROUTES.includes(name)) {
    navigate("/timeline");
    return;
  }

  renderNav(currentUser);

  switch (name) {
    case "login":
      renderLogin();
      break;
    case "signup":
      renderSignup();
      break;
    case "timeline":
      renderTimeline(query.scope === "all" ? "all" : "following");
      break;
    case "post":
      renderPostDetail(Number(segments[1]));
      break;
    case "profile":
      if (segments[2] === "following") {
        renderFollowList(segments[1], "following");
      } else if (segments[2] === "followers") {
        renderFollowList(segments[1], "followers");
      } else {
        renderProfile(segments[1]);
      }
      break;
    case "search":
      renderSearch(query.q || "", query.type || "users");
      break;
    default:
      navigate("/timeline");
  }
}

window.addEventListener("hashchange", handleRoute);
window.addEventListener("DOMContentLoaded", handleRoute);
