<template>
  <div class="min-h-screen bg-zinc-900">
    <Navbar />

    <div class="py-5">
      <main>
        <div class="mx-auto max-w-7xl min-w-screen px-4 sm:px-6 lg:px-8">
          <div class="grid-cols-2 flex">
            <div class="col-1 mx-5 flex-1">
                <div class="grid-cols-2 flex content-start">
                    <h1 class="text-3xl font-bold tracking-tight text-white m-5 col-1 flex-1">Friends</h1>
                    <UserSearch @add-friend="addFriend" class="col-2 flex-4"/>
                </div>
                <List :users="friendNames" :type="'Friends'" @reload="reload"/>
                <Footer
                  @next-pressed="nextPage('Friends')"
                  @prev-pressed="prevPage('Friends')"
                  @page-selected="setPage('Friends', $event)"
                  :page="friendsPage"
                  :count="friendLength"
                />
            </div>
            <div class="col-2 mx-5 flex-1">
                <h1 class="text-3xl font-bold tracking-tight text-white m-5">Friend Requests</h1>
                <List :requests="requests" :type="'Requests'" @reload="reload"/>
                <Footer
                  @next-pressed="nextPage('Requests')"
                  @prev-pressed="prevPage('Requests')"
                  @page-selected="setPage('Requests', $event)"
                  :page="requestsPage"
                  :count="requestLength"
                />
            </div>
          </div>
        </div>
      </main>
    </div>
    <InfoNotification ref="friendNotification" />
  </div>
</template>

<script setup lang="ts">
import InfoNotification from '~/components/Notifications/InfoNotification.vue';

function reload() {
  api.UserRelationship_GetFriendRequests(undefined)
  .then((requests) => {
      requestList.value = requests;
  });
  api.UserRelationship_GetFriends(undefined)
  .then((friends) => {
      friendsList.value = friends;
  });
}
reload();

const friendsList: Ref<{
        username?: string | null,
}[] | undefined> = ref();
const requestList: Ref<{
    userFrom?: {
        userName?: string | null
    },
    id?: string | null
}[] | undefined> = ref();

const friendsPage = ref(0);
const requestsPage = ref(0);
const pageSize = 5;
const friendLength = computed(() => friendsList.value?.length);
const requestLength = computed(() => requestList.value?.length);
const friendsTotalPages = computed(() => Math.max(1, Math.ceil((friendLength.value ?? 0) / pageSize)));
const requestsTotalPages = computed(() => Math.max(1, Math.ceil((requestLength.value ?? 0) / pageSize)));

const friendNames = computed(() => friendsList.value
    ?.map((friend) => friend.username ?? "Null")
    .slice(pageSize * friendsPage.value, pageSize * friendsPage.value + pageSize));
const requests = computed(() => {
  return requestList.value?.map(request => {
    return {
      username: request.userFrom?.userName ?? "Null",
      requestId: request.id ?? "Null"
    }
  }).slice(pageSize * requestsPage.value, pageSize * requestsPage.value + pageSize);
});

function nextPage(window: "Friends" | "Requests") {
    if (window === "Friends") {
        if (friendsPage.value >= friendsTotalPages.value - 1) return;

        friendsPage.value += 1;
    }

    else if (window === "Requests") {
        if (requestsPage.value >= requestsTotalPages.value - 1) return;

        requestsPage.value += 1;
    }
}

function prevPage(window: "Friends" | "Requests") {
    if (window === "Friends") {
        if (friendsPage.value == 0) return;

        friendsPage.value -= 1;
      }

      else if (window === "Requests") {
        if (requestsPage.value == 0) return;

        requestsPage.value -= 1;
    }
}

function setPage(window: "Friends" | "Requests", page: number) {
    if (window === "Friends") {
        friendsPage.value = Math.min(Math.max(page, 0), friendsTotalPages.value - 1);
    }

    else if (window === "Requests") {
        requestsPage.value = Math.min(Math.max(page, 0), requestsTotalPages.value - 1);
    }
}

const friendNotification = ref();

async function addFriend(username: string) {
  try {
    await api.UserRelationship_AddFriendRequest({
    username: username
    });

    friendNotification.value.succeed("Friend Request Sent", `Successfully sent a friend request ${username}.`);
  }
  catch {
    friendNotification.value.fail("Friend Request Failed", `Failed to send a friend request to ${username}.`);
  }
}
</script>