import { updateActivePage } from "../../commons/helpers";

describe("updateActivePage", () => {
    it("should not change the active page if the removed item is not last on the page", () => {
        const activePage = 2;
        const itemsCount = 10;
        const itemsCountPerPage = 5;
        const changeActivePage = jest.fn();
        updateActivePage(
            activePage,
            itemsCount,
            itemsCountPerPage,
            changeActivePage
        );
        expect(changeActivePage).not.toHaveBeenCalled();
    });

    it("should decrease the active page by 1 if the removed item is last on the page and the active page is not the first page", () => {
        const activePage = 4;
        const itemsCount = 31;
        const itemsCountPerPage = 10;
        const changeActivePage = jest.fn();
        updateActivePage(
            activePage,
            itemsCount,
            itemsCountPerPage,
            changeActivePage
        );
        expect(changeActivePage).toHaveBeenCalled();
    });

    it("should not change the active page if the removed item is last on the page but the active page is the first page", () => {
        const activePage = 1;
        const itemsCount = 5;
        const itemsCountPerPage = 5;
        const changeActivePage = jest.fn();
        updateActivePage(
            activePage,
            itemsCount,
            itemsCountPerPage,
            changeActivePage
        );
        expect(changeActivePage).not.toHaveBeenCalled();
    });
});
