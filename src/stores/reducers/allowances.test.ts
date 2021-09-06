// foo.spec.ts
import { mocked } from "ts-jest/utils";
import allowancesReducer, { IAllowancesAction } from "./allowances";

describe("allowances reducer", () => {
  describe("add allowance", () => {
    describe("invalid input", () => {
      test("should return the initial state", () => {
        expect(
          allowancesReducer(undefined, {
            type: "ADD_ALLOWANCE",
            payload: {}
          })
        ).toEqual([]);
      });
    });
    describe("adding a disabled payload", () => {
      test("should return the initial state", () => {
        expect(
          allowancesReducer(undefined, {
            type: "ADD_ALLOWANCE",
            payload: {
              enabled: false,
              limit: 10,
              url: "http://abc.def"
            }
          })
        ).toEqual([]);
      });
    });
    test("should add an initial payload", () => {
      expect(
        allowancesReducer(undefined, {
          type: "ADD_ALLOWANCE",
          payload: {
            enabled: true,
            limit: 10,
            url: "http://abc.def"
          }
        })
      ).toEqual([
        {
          enabled: true,
          limit: 10,
          spent: 0,
          url: "http://abc.def"
        }
      ]);
    });
    test("should add a second payload", () => {
      const initialPayload = {
        enabled: true,
        limit: 10,
        spent: 0,
        url: "http://abc.def"
      };
      const secondPayload = {
        enabled: true,
        limit: 15,
        spent: 0,
        url: "http://abc.def"
      };
      const newState = allowancesReducer([initialPayload], {
        type: "ADD_ALLOWANCE",
        payload: secondPayload
      });
      expect(newState.length).toBe(2);
      expect(newState[0]).toEqual(initialPayload);
      expect(newState[1]).toEqual(secondPayload);
    });
  });
  describe("set limit", () => {
    const state = [
      {
        enabled: true,
        limit: 10,
        spent: 0,
        url: "http://abc.def"
      }
    ];
    test("set the limit", () => {
      expect(
        allowancesReducer(state, {
          type: "SET_LIMIT",
          payload: { url: "http://abc.def", limit: 50 }
        })
      ).toEqual([
        {
          enabled: true,
          limit: 50,
          spent: 0,
          url: "http://abc.def"
        }
      ]);
    });
    describe("invalid input", () => {
      describe("no limit", () => {
        test("should ignore the input", () => {
          expect(
            allowancesReducer(state, {
              type: "SET_LIMIT",
              payload: { url: "http://abc.def" }
            })
          ).toEqual(state);
        });
      });
      describe("no url", () => {
        test("should ignore the input", () => {
          expect(
            allowancesReducer(state, {
              type: "SET_LIMIT",
              payload: { limit: 10 }
            })
          ).toEqual(state);
        });
      });
    });
  });
  describe("reset allowance", () => {
    const state = [
      {
        enabled: true,
        limit: 10,
        spent: 5,
        url: "http://abc.def"
      }
    ];
    test("reset the allowance", () => {
      expect(
        allowancesReducer(state, {
          type: "RESET_ALLOWANCE",
          payload: { url: "http://abc.def" }
        })
      ).toEqual([
        {
          enabled: true,
          limit: 10,
          spent: 0,
          url: "http://abc.def"
        }
      ]);
    });
    describe("invalid input", () => {
      describe("no url", () => {
        test("should ignore the input", () => {
          expect(
            allowancesReducer(state, {
              type: "RESET_ALLOWANCE",
              payload: {}
            })
          ).toEqual(state);
        });
      });
    });
  });
  describe("toggle allowance", () => {
    const state = [
      {
        enabled: true,
        limit: 10,
        spent: 5,
        url: "http://abc.def"
      }
    ];
    test("toggle the allowance", () => {
      expect(
        allowancesReducer(state, {
          type: "TOGGLE_ALLOWANCE",
          payload: { url: "http://abc.def", enabled: false }
        })
      ).toEqual([
        {
          enabled: false,
          limit: 10,
          spent: 5,
          url: "http://abc.def"
        }
      ]);
    });
    describe("invalid input", () => {
      describe("no url", () => {
        test("should ignore the input", () => {
          expect(
            allowancesReducer(state, {
              type: "TOGGLE_ALLOWANCE",
              payload: {}
            })
          ).toEqual(state);
        });
      });
    });
  });
  describe("remove allowance", () => {
    const state = [
      {
        enabled: true,
        limit: 10,
        spent: 5,
        url: "http://abc.def"
      }
    ];
    test("toggle the allowance", () => {
      expect(
        allowancesReducer(state, {
          type: "REMOVE_ALLOWANCE",
          payload: { url: "http://abc.def" }
        })
      ).toEqual([]);
    });
    describe("invalid input", () => {
      describe("no url", () => {
        test("should ignore the input", () => {
          expect(
            allowancesReducer(state, {
              type: "REMOVE_ALLOWANCE",
              payload: {}
            })
          ).toEqual(state);
        });
      });
    });
  });
});
