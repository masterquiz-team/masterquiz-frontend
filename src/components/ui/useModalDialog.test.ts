import { expect, it } from "vitest";
import { tabStops } from "./useModalDialog";

type Control = { id: string; radio?: { name: string; checked: boolean } };
const radio = (id: string, name: string, checked = false): Control => ({
  id,
  radio: { name, checked },
});
const ids = (controls: Control[]) =>
  tabStops(controls, (control) => control.radio ?? null).map(({ id }) => id);

it("keeps only the checked option of a radio group", () => {
  expect(
    ids([
      { id: "close" },
      radio("a1", "a"),
      radio("a2", "a", true),
      radio("a3", "a"),
      { id: "save" },
    ]),
  ).toEqual(["close", "a2", "save"]);
});

it("uses the first option while no radio is checked", () => {
  expect(ids([radio("a1", "a"), radio("a2", "a"), { id: "save" }])).toEqual([
    "a1",
    "save",
  ]);
});

it("treats each radio group separately", () => {
  expect(
    ids([radio("a1", "a"), radio("b1", "b"), radio("b2", "b", true)]),
  ).toEqual(["a1", "b2"]);
});
