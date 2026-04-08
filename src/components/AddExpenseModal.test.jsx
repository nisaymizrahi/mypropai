import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import AddExpenseModal from "./AddExpenseModal";

vi.mock("../utils/api", () => ({
  analyzeExpenseReceipt: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const buildProps = (overrides = {}) => ({
  isOpen: true,
  onClose: vi.fn(),
  investmentId: "investment-1",
  budgetItems: [
    {
      _id: "scope-1",
      category: "Framing",
      awards: [],
    },
  ],
  vendors: [],
  projectReceipts: [],
  fundingSources: [],
  drawRequests: [],
  initialValues: {},
  ...overrides,
});

describe("AddExpenseModal", () => {
  it("keeps typed payment values during parent rerenders while open", () => {
    const { rerender } = render(<AddExpenseModal {...buildProps()} />);

    const titleInput = screen.getByPlaceholderText(
      "Draw fee, permit payment, framing deposit, utility bill"
    );
    const amountInput = screen.getByRole("spinbutton");

    fireEvent.change(titleInput, {
      target: { value: "Permit payment" },
    });
    fireEvent.change(amountInput, {
      target: { value: "1250.25" },
    });

    expect(titleInput).toHaveValue("Permit payment");
    expect(amountInput).toHaveValue(1250.25);

    rerender(
      <AddExpenseModal
        {...buildProps({
          budgetItems: [
            {
              _id: "scope-1",
              category: "Framing",
              awards: [],
            },
          ],
          initialValues: {},
        })}
      />
    );

    expect(
      screen.getByPlaceholderText("Draw fee, permit payment, framing deposit, utility bill")
    ).toHaveValue("Permit payment");
    expect(screen.getByRole("spinbutton")).toHaveValue(1250.25);
  });
});
