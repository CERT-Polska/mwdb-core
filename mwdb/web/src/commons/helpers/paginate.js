export function updateActivePage(
    activePage,
    itemsCount,
    itemsCountPerPage,
    changeActivePage
) {
    // if removed item is last on page
    if (activePage !== 1 && (itemsCount - 1) % itemsCountPerPage === 0)
        changeActivePage((p) => p - 1);
}
