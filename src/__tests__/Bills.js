/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
// import Actions from "../views/Actions.js"
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    test("When I click on buttonNewBill, then I navigate to NewBillPage", () => {
      // mise en place de l'environnement
      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const BillsPage = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      // récupération des éléments
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      const callBack = jest.fn(() => BillsPage.handleClickNewBill());
      buttonNewBill.addEventListener("click", callBack);
      // simulation de click surle bouton
      fireEvent.click(buttonNewBill);
      expect(callBack).toHaveBeenCalled();
    });
    test("When I click on iconEye, a modal is displayed with the correct content", () => {
      //mock
      $.fn.modal = jest.fn();

      // mise en place de l'environnement
      document.body.innerHTML = BillsUI({ data: bills });

      // Créer une instance de la classe Bills
      const billsPage = new Bills({
        document,
        store: null,
        localStorage: window.localStorage,
      });

      const iconEyes = screen.getAllByTestId("icon-eye");
      iconEyes.forEach((iconEye) => {
        // mock de la fonction eventListener pour passer en paramètre l'icône plutôt que l'événement.
        const callBack = jest.fn(billsPage.handleClickIconEye(iconEye));
        iconEye.addEventListener("click", callBack);
      });
      // Simuler un clic sur l'icône
      fireEvent.click(iconEyes[0]);

      const modale = screen.getByTestId("modaleFile");
      // Vérifier que la fonction modal du plugin jQuery a été appelée avec les bons arguments
      expect($.fn.modal).toHaveBeenCalledWith("show");
      // vérifier que la modale s'affiche après un clic
      expect(modale).toBeTruthy();
    });
  });
});
