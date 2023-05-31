import { useNavRedirect } from "@mwdb-web/commons/hooks";
import { renderHook, act } from "@testing-library/react";

const navigateMock = jest.fn();
const locationMock = { state: { prevLocation: "/" } };

jest.mock("react-router-dom", () => ({
    useNavigate: () => navigateMock,
    useLocation: () => locationMock,
}));

describe("useNavRedirect", () => {
    beforeEach(() => {
        navigateMock.mockClear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should call navigate with the provided URL", () => {
        const { result } = renderHook(() => useNavRedirect());
        const url = "/redirect";
        act(() => {
            result.current.redirectTo(url);
        });
        expect(navigateMock).toHaveBeenCalledWith(url);
    });

    test("should call navigate with the previous location", () => {
        const { result } = renderHook(() => useNavRedirect());
        act(() => {
            result.current.goBackToPrevLocation();
        });
        expect(navigateMock).toHaveBeenCalledWith("/");
    });
});
