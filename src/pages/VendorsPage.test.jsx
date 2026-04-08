import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import VendorsPage from "./VendorsPage";
import { getVendors } from "../utils/api";

vi.mock("../utils/api", () => ({
  deleteVendor: vi.fn(),
  getVendors: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../components/VendorFormModal", () => ({
  default: ({ isOpen }) => (isOpen ? <div>Vendor form modal</div> : null),
}));

vi.mock("../components/VendorProcurementPanel", () => ({
  default: ({ vendor }) => <div>Procurement panel for {vendor.name}</div>,
}));

vi.mock("../components/VendorDocumentsPanel", () => ({
  default: ({ vendor }) => <div>Documents panel for {vendor.name}</div>,
}));

const vendors = [
  {
    _id: "vendor-1",
    name: "Northline Plumbing",
    specialties: ["Plumber", "General Contractor"],
    description: "Fast plumbing team for turns and medium rehab.",
    notes: "Usually responds same day.",
    status: "preferred",
    afterHoursAvailable: true,
    serviceArea: "Dallas-Fort Worth",
    contactInfo: {
      contactName: "Maria Alvarez",
      email: "maria@northline.com",
      phone: "(555) 101-0101",
      address: "123 Main St, Dallas, TX",
    },
    documents: [
      {
        _id: "doc-1",
        displayName: "W-9",
        category: "W-9",
      },
      {
        _id: "doc-2",
        displayName: "COI",
        category: "Certificate of Insurance",
      },
      {
        _id: "doc-3",
        displayName: "Signed MSA",
        category: "Signed Contract / MSA",
      },
      {
        _id: "doc-4",
        displayName: "Invoice 001",
        category: "Invoice",
      },
    ],
  },
  {
    _id: "vendor-2",
    name: "Quickline Electric",
    specialties: ["Electrician"],
    description: "Electrical contractor for rewires and service upgrades.",
    notes: "",
    status: "active",
    afterHoursAvailable: false,
    serviceArea: "Collin County",
    contactInfo: {
      contactName: "Devon Shah",
      email: "ops@quickline.com",
      phone: "(555) 202-0202",
      address: "",
    },
    documents: [],
  },
];

describe("VendorsPage", () => {
  beforeEach(() => {
    vi.mocked(getVendors).mockResolvedValue(vendors);
  });

  it("loads vendors, filters by search, and switches detail tabs", async () => {
    render(<VendorsPage />);

    expect((await screen.findAllByText("Northline Plumbing")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quickline Electric").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "quickline" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Northline Plumbing")).not.toBeInTheDocument();
    });

    expect(screen.getAllByText("Quickline Electric").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Quickline Electric/i }));
    fireEvent.click(screen.getByRole("button", { name: "Procurement" }));

    expect(screen.getByText("Procurement panel for Quickline Electric")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Documents" }));

    expect(screen.getByText("Documents panel for Quickline Electric")).toBeInTheDocument();
  });
});
