export function updateActivePage(
    activePage: number,
    itemsCount: number,
    itemsCountPerPage: number,
    changeActivePage: (p: (page: number) => number) => void
) {
    // if removed item is last on page
    if (activePage !== 1 && (itemsCount - 1) % itemsCountPerPage === 0)
        changeActivePage((p: number) => p - 1);
}
