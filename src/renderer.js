/**
 * Renderer script for the standalone server list.
 */
document.addEventListener('DOMContentLoaded', () => {
    const serverList = new ServerList();
    serverList.mount('#app');
    serverList.show();
});
