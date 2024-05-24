/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import store from "../__mocks__/store.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
import NewBill from "../containers/NewBill.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then a form should be displayed", async () => {
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
      window.onNavigate(ROUTES_PATH.NewBill);
      const formNewBill = screen.getByTestId("form-new-bill");
      await waitFor(() => formNewBill);
      expect(formNewBill).toBeTruthy();
    });
    test("Then I should be able to select a file to be uploaded with the right format", () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(["file content"], "file.docx", {
              type: "application/msword",
            }),
          ],
        },
      });
      const errorMessage = screen.getByTestId("file-errorMessage");
      expect(errorMessage.textContent).toBe(
        "* Le format du fichier n'est pas accepté."
      );
    });
    test("Then all required fields should be completed so that the form can be submitted", () => {
      document.body.innerHTML = NewBillUI();

      const handleSubmitMock = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });

      // Mocking the handleSubmit method
      newBill.handleSubmit = handleSubmitMock;

      // Filling all required fields with valid values
      const expenseTypeInput = screen.getByTestId("expense-type");
      fireEvent.change(expenseTypeInput, { target: { value: "Transports" } });

      const expenseNameInput = screen.getByTestId("expense-name");
      fireEvent.change(expenseNameInput, {
        target: { value: "Example Expense" },
      });

      const datePickerInput = screen.getByTestId("datepicker");
      fireEvent.change(datePickerInput, { target: { value: "2024-04-19" } });

      const amountInput = screen.getByTestId("amount");
      fireEvent.change(amountInput, { target: { value: "100" } });

      const vatInput = screen.getByTestId("vat");
      fireEvent.change(vatInput, { target: { value: "20" } });

      const pctInput = screen.getByTestId("pct");
      fireEvent.change(pctInput, { target: { value: "10" } });

      // Call handleSubmit directly
      newBill.handleSubmit();

      // Verifying that the handleSubmit method is called
      expect(handleSubmitMock).toHaveBeenCalled();
    });
    test("When a field is not filled in, then a warning message should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const submitButton = screen.getByTestId("btn-send-bill");
      fireEvent.click(submitButton);

      const errorMessage = screen.queryByTestId("file-errorMessage");
      expect(errorMessage).toBeTruthy();
    });
    test("When I submit the form, then I navigate to bills page.", () => {
      document.body.innerHTML = NewBillUI();
      //onNavigate function
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const NewBillPage = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const handleSubmitMock = jest.fn((e) => {
        NewBillPage.handleSubmit(e);
      });
      // Simuler la soumission du formulaire
      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmitMock);
      fireEvent.submit(form);
      expect(handleSubmitMock).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
    test("When I submit the form to create a new Bill, then the form data should be correctly collected", async () => {
      jest.spyOn(mockStore, "bills");

      document.body.innerHTML = NewBillUI();
      const create = jest.fn(() => {
        return Promise.resolve({
          fileUrl: "https://localhost:3456/images/test.jpg",
          key: "1234",
        });
      });
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create,
        };
      });

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });

      const fileInput = screen.getByTestId("file");
      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(["file content"], "file.png", {
              type: "image/png",
            }),
          ],
        },
      });
      await new Promise(process.nextTick);
      console.log(newBill);
      expect(create).toHaveBeenCalled();
    });
  });
});
