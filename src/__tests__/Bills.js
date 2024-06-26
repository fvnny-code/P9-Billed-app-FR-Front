/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/store", () => mockStore);

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
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const year = new Date().getFullYear();
      const monthList = [...Array(12).keys()];
      const formatter = new Intl.DateTimeFormat("fr", {
        month: "short",
      });
      const monthsName = monthList.map((m) =>
        formatter.format(new Date(year, m))
      );

      const dates = screen
        .getAllByText(/^[0-9]{1,2}[ ][a-zA-Z]{3}\.[ ][0-9]{2}$/i)
        .map((a) => a.innerHTML)
        .map((a) => {
          const [day, month, year] = a.split(" ");
          const cMonth = month.replace(".", "");
          const index = monthsName.findIndex((c) => cMonth === c);

          return new Date(`20${year}`, index, day);
        });
      
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

    // test d'intégration GET

    describe("When an error occurs on Api", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "e@e",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("Fetch bills and fail with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
      test("Fetch bills and fail with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
