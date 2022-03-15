import { isEqualExcludingDates } from "../is-equal-excluding-dates";

describe("isEqualExcludingDates", () => {
  it("returns false if the strings are different", () => {
    const out = isEqualExcludingDates("hello world", "hello mars");
    expect(out).toBe(false);
  });

  it("returns true if the strings are identical", () => {
    const out = isEqualExcludingDates("hello world", "hello world");
    expect(out).toBe(true);
  });

  it("returns true if the strings only differ by a date", () => {
    const out = isEqualExcludingDates(
      "hello 1 March 2022, world",
      "hello 15 August 2030, world"
    );
    expect(out).toBe(true);
  });

  it("returns false if the strings differ by a date and other content", () => {
    const out = isEqualExcludingDates(
      "hello 1 March 2022, world",
      "hello 25 August 2030, mars"
    );
    expect(out).toBe(false);
  });

  it("returns true if multiple date differ, but nothing else does", () => {
    const out = isEqualExcludingDates(
      "hello 1 March 2022, world: 31 October 2040",
      "hello 25 August 2030, world: 4 February 2052"
    );
    expect(out).toBe(true);
  });
});
