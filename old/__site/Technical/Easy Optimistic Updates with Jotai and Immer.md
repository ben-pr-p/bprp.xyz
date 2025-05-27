> Take a quick glance at [[Derived Atom with Immer]] before reading this.

Optimistic updates are hard. 

In order to implement them properly, you need to:
1. Make some set of changes to your state
2. Kick off some asynchronous action to sync that state with the server
3. If there's an error, roll back **just** the changes you made in step 1

Step 3 is of course the hard part, especially if your action is modifying some deeply nested attribute of a larger state object. If you do some naive implementation like:
1. Take a snapshot of your state
2. Make some set of changes to your state
3. Kick off some asynchronous action to sync the state
4. If there's an error, restore the snapshot you took in step 1

You will have a bug that involves resetting any other changes to the state that happened in the interim. No good!

## Solution
The solution I developed is a hook, called `useAtomImmerSaga`. Here's what it looks like to use it in a section of code responsible for updating the value of a toggle representing whether a particular relationship is directed or has no direction.

```typescript
export const useRelationshipKindHasDirection = (
  id: IDTypes["relationshipKind"]
) => {
  const [relationshipKind, runSaga] = useAtomImmerSaga(
    relationshipKindByIdAtomFamily(id)
  );

  const setHasDirection = (hasDirection: boolean) =>
    runSaga((saga) =>
      saga
        .update((draft) => {
          draft.has_direction = hasDirection;
        })
        .effect(async (_nextState, _relationshipKind) => {
          await trpc.updateRelationshipKind.mutate({
            id: id,
            patch: { has_direction: hasDirection },
          });
        })
    );

  return [relationshipKind.has_direction, setHasDirection] as const;
};
```

And this is what it looks like to build a component using that hook:
```tsx
const EditableRelationshipHasDirection = ({
  id,
}: {
  id: IDTypes["relationshipKind"];
}) => {
  const [hasDirection, setHasDirection] = useRelationshipKindHasDirection(id);

  return (
    <button
	  type="button"
	  onClick={() => setHasDirection(!hasDirection)}
    />
  );
};
```

I think it's pretty great! You get a hook that abstracts the network call, the application of the optimistic update, and its rollback in the event of a network failure.

The key bit is the typed `saga`, which has `.update`, `.effect`, and `.postEffect` methods.

The `.update` method is applied immediately - that's the optimistic state update, which, thanks to `immer`, you can just apply via easy imperative object mutation.

The `.effect` method contains the network call or other asynchronous side effect of the user action. If it throws, the changes applied during the `.update` method and ***only those changes*** will be rolled back. The full state will not be reset to what it was before the network mutation.

There is also a `.postEffect` method for applying some state update after the network call has succeeded. I was originally using it to plug in a server generated ID, but I have since switched to using client side generated branded IDs for my particular project. I'm going to keep it around for a while to make sure I don't need it for anything else.
## Code

If you want to use this and for me to make it a package, tell me to do so!

```typescript
import { Atom, WritableAtom, atom, useAtomValue, useSetAtom } from "jotai";

import {
  Draft,
  Objectish,
  Patch,
  applyPatches,
  castImmutable,
  enablePatches,
  produce,
  produceWithPatches,
} from "immer";
import { useEffect } from "react";

enablePatches();

export const useSetInitialAtomValueFromQuery = <AtomValue>(
  setAtomValue: (update: AtomValue) => void,
  queryData: AtomValue | undefined,
  isLoading: boolean
) => {
  useEffect(() => {
    if (!isLoading && queryData) {
      setAtomValue(queryData);
    }
  }, [setAtomValue, queryData, isLoading]);
};

type ImmerifiedAtom<Value> = WritableAtom<
  Value,
  [(draft: Draft<Value>) => void],
  void
>;

type ImmerUpdateFn<Value> = (
  draft: Draft<Value>
) => void | Promise<void | undefined>;

export const createDerivedImmerAtom = <AtomValue, DerivedValue>(
  rootAtom: ImmerifiedAtom<AtomValue>,
  getDerivedValue: (value: AtomValue) => DerivedValue
) => {
  const result = atom(
    (get) => {
      return castImmutable(getDerivedValue(get(rootAtom)));
    },
    (_get, set, update: ImmerUpdateFn<DerivedValue>) => {
      set(rootAtom, (draft) => {
        const subObject = getDerivedValue(draft as AtomValue);
        update(subObject as Draft<DerivedValue>);
      });
    }
  );

  return result;
};

export const asyncWithImmer = <Value>(rootAtom: Atom<Promise<Value>>) => {
  const newSyncAtom = atom<Value | undefined>(undefined);
  const result = atom(
    (get) => {
      return get(rootAtom);
    },
    async (get, set, update: (draft: Draft<Value>) => void) => {
      const value = await get(rootAtom);
      set(newSyncAtom, produce(value, update));
    }
  );

  return result;
};

type ImmerUpdateFnWithReturn<Value, ReturnContext> = (
  draft: Draft<Value>
) => ReturnContext;

export type LinkedEffectUpdateTuple<Value, ReturnContext, EffectResult> = {
  update?: ImmerUpdateFnWithReturn<Value, ReturnContext>;
  effect?: (next: Value, context: ReturnContext) => Promise<EffectResult>;
  postEffect?: (
    draft: Draft<Value>,
    effectResult: EffectResult
  ) => void | Promise<void>;
};

type Updater<Value, ReturnContext = unknown, EffectResult = unknown> = {
  update: <NewReturnContext>(
    updateFn: (draft: Draft<Value>) => NewReturnContext
  ) => Updater<Value, NewReturnContext, unknown>;
  effect: <NewEffectResult>(
    effectFn: (next: Value, context: ReturnContext) => Promise<NewEffectResult>
  ) => Updater<Value, ReturnContext, NewEffectResult>;
  postEffect: (
    postEffectFn: (draft: Draft<Value>, effectResult: EffectResult) => void
  ) => Updater<Value, ReturnContext, EffectResult>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SagaBuilderWithoutVerification = Updater<any, any, any>;

type Saga<Value, ReturnContext, EffectResult> = {
  update?: ImmerUpdateFnWithReturn<Value, ReturnContext>;
  effect?: (next: Value, context: ReturnContext) => Promise<EffectResult>;
  postEffect?: (
    draft: Draft<Value>,
    effectResult: EffectResult
  ) => void | Promise<void>;
};

type SagaBuilder<Value, ReturnContext = unknown, EffectResult = unknown> = {
  update: <NewReturnContext>(
    updateFn: (draft: Draft<Value>) => NewReturnContext
  ) => SagaBuilder<Value, NewReturnContext, unknown>;
  effect: <NewEffectResult>(
    effectFn: (next: Value, context: ReturnContext) => Promise<NewEffectResult>
  ) => SagaBuilder<Value, ReturnContext, NewEffectResult>;
  postEffect: (
    postEffectFn: (draft: Draft<Value>, effectResult: EffectResult) => void
  ) => SagaBuilder<Value, ReturnContext, EffectResult>;
};

type SagaBuilderProvider<Value> = (sagaBuilder: SagaBuilder<Value>) => void;

export const useAtomImmerSaga = <Value extends Objectish>(
  atom: WritableAtom<Value, [(draft: Draft<Value>) => void], void>
) => {
  const atomValue = useAtomValue(atom);
  const setAtomValue = useSetAtom(atom);

  const runSaga = (sagaCollectorFn: SagaBuilderProvider<Value>) => {
    const saga: Saga<Value, unknown, unknown> = {};

    // Define the saga collector
    const collector: SagaBuilder<Value> = {
      update: (updateFn) => {
        saga.update = updateFn;
        return collector as SagaBuilderWithoutVerification;
      },
      effect: (effectFn) => {
        saga.effect = effectFn;
        return collector as SagaBuilderWithoutVerification;
      },
      postEffect: (postEffectFn) => {
        saga.postEffect = postEffectFn;
        return collector as SagaBuilderWithoutVerification;
      },
    };

    // Collect the saga
    sagaCollectorFn(collector);

    // Run the saga
    const runUpdate = saga.update;
    const runEffect = saga.effect;
    const runPostEffect = saga.postEffect;

    let resultContext: unknown;

    if (runUpdate) {
      let nextState: Value = undefined as unknown as Value;
      let inversePatches: Patch[] = [];

      // Rerender happens from optimistic update
      setAtomValue((originalDraft) => {
        // originalDraft is the latest state - we can only access the latest state in draft form
        const [nestedNextState, nestedPatches, nestedInversePatches] =
          produceWithPatches(originalDraft as Value, (nestedDraft) => {
            resultContext = runUpdate(nestedDraft);
          });

        // Now, the draft has already been modified
        // No need to return anything
        applyPatches(originalDraft, nestedPatches);
        nextState = nestedNextState;
        inversePatches = nestedInversePatches;
      });

      // Run the effect
      if (runEffect) {
        runEffect(nextState, resultContext)
          .then((effectResult) => {
            // On success, run the post effect hook with the effect result
            if (runPostEffect) {
              setAtomValue((draft) => {
                runPostEffect(draft, effectResult);
              });
            }
          })
          .catch((_error) => {
            // On error, undo the original update patches
            // There is an error here because there's no get
            setAtomValue((draft) => {
              applyPatches(draft, inversePatches);
            });
          });
      }
    }
  };

  const resultTuple: [Value, typeof runSaga] = [atomValue, runSaga];
  return resultTuple;
};

```

## Old Version

This was the first version I had. The new version above is better.

I've got a quick recipe that makes this really easy, relying on similar techniques to [[Derived Atom with Immer]]. Here's the setup:

```tsx
const bigAtomWithNestedObjects = atomWithImmer({
  bigListOfEntities: [
    {
      name: 'a',
      count: 42
    },
    {
      name: 'j',
      count: 89
    }
  ],
  anotherObject: {
    nestedDate: new Date(),
    nestedNumber: 1
  }
});

const anotherObjectAtom = createDerivedImmerAtomWithLinkedEffect(
  bigAtomWithNestedObjects,
  bawno => bawno.anotherObject
);
```

And here's what it's like to use in a component:
```tsx
const EditAnotherObjectName = () => {
  const [anotherObject, setAnotherObject] = useAtom(anotherObjectAtom)

  return (
    <input value={anotherObject.name}
      onChange={ev => {
        setAnotherObject([
          draft => {
            draft.name = ev.target.value
          }),
          async newObject => {
            // if this throws
            // the state changes in the above draft will be undone
            await client.setObjectName(newObject.name)
          }
        ])
      }}
    />
  );
}
```

That's it!

If your second element of the tuple (the asynchronous sync function) throws an error, the changes you make in your update function – and **only** those changes – will be undone.

This relies on [Immer's patches feature](https://immerjs.github.io/immer/patches/#producewithpatches) . Here's the full code below:
```typescript
import {
  Draft,
  Objectish,
  applyPatches,
  enablePatches,
  produceWithPatches,
} from "immer";

enablePatches();


const createDerivedImmerAtomWithLinkedSideEffect = <
  AtomValue,
  DerivedValue extends Objectish
>(
  rootAtom: ImmerifiedAtom<AtomValue>,
  getDerivedValue: (value: AtomValue | Draft<AtomValue>) => DerivedValue
) => {
  const result = atom(
    (get) => {
      return getDerivedValue(get(rootAtom));
    },
    (get, set, update: LinkedEffectUpdateTuple<DerivedValue>) => {
      const [updateFn, linkedEffect] = update;

      /**
       * Run produceWithPatches to get the patches and inverse patches
       */
      const derivedValue = getDerivedValue(get(rootAtom));
      const [nextState, patches, inversePatches] = produceWithPatches(
        derivedValue,
        (draft) => {
          updateFn(draft);
        }
      );

      /**
       * Apply the patches to the nested object on the root atom
       */
      set(rootAtom, (draft) => {
        const subObject = getDerivedValue(draft);
        applyPatches(subObject, patches);
      });

      /**
       * Run the linked effect
       * if successful, do nothing
       * if error, apply the inverse patches
       */
      linkedEffect(nextState).catch(() => {
        set(rootAtom, (draft) => {
          const subObject = getDerivedValue(draft);
          applyPatches(subObject, inversePatches);
        });
      });
    }
  );

  return result;
};
```

Pretty good if you ask me!

I can now also create very small re-usable hooks for optimistically updating specific properties on nested objects:
```typescript
const useAnotherObjectName = () => {
  const [anotherObject, setAnotherObject] = useAtom(anotherObjectAtom)

  const setName = (newName: string) => {
    setAnotherObject([
      draft => {
        draft.name = newName;
      }),
      async newObject => {
        await client.setObjectName(newObject.name);
      }
    ])
  }

  return [anotherObject.name, setName]
}
```

Pretty good, pretty pretty good.