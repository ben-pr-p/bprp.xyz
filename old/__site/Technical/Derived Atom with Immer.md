Here's a quick recipe I am very happy with for use with [Jotai](https://jotai.org/). It's a huge time saver, very little code, and it let's you use a super easy mental model for updated state of giant nested objects.

It's called `createDerivedImmerAtom`, and this is how you use it:
```typescript
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

const aAtomWithImmer = createDerivedImmerAtom(
  bigAtomWithNestedObjects,
  bawno => bawno.bigListOfEntities.find(entity => entity.find(name === 'a'))
);

const anotherObjectAtom = createDerivedImmerAtom(
  bigAtomWithNestedObjects,
  bawno => bawno.anotherObject
);
```

This is slightly magic - `aAtomWithImmer` is now writeable, **and** nicely write-able with [Immer](https://immerjs.github.io/immer/) style draft functions, and I haven't had to write any setter for it.

For example, I can do:
```tsx
const EditAnotherObjectName = () => {
  const [anotherObject, setAnotherObject] = useAtom(anotherObjectAtom)

  return (
    <input value={anotherObject.name}
      onChange={ev => {
	    setAnotherObject(draft => {
	      draft.name = ev.target.value
	    })
      }
    />
  );
}
```

This is slightly more powerful than [jotai-optics](https://jotai.org/docs/extensions/optics), since you get to use simple Javascript for the selector (instead of optic's DSL). And, it's way easier than the alternative of creating a derived atom with a manual setter and than wrapping that with `withImmer`.

The code is very short:
```typescript
type ImmerifiedAtom<Value> = WritableAtom<
  Value,
  [(draft: Draft<Value>) => void],
  void
>;

type ImmerUpdateFn<Value> = (
  draft: Draft<Value>
) => void | Promise<void | undefined>;

const createDerivedImmerAtom = <AtomValue, DerivedValue>(
  rootAtom: ImmerifiedAtom<AtomValue>,
  getDerivedValue: (value: AtomValue | Draft<AtomValue>) => DerivedValue
) => {
  const result = atom(
    (get) => {
      return getDerivedValue(get(rootAtom));
    },
    (_get, set, update: ImmerUpdateFn<DerivedValue>) => {
      set(rootAtom, (draft) => {
        const subObject = getDerivedValue(draft);
        update(subObject as Draft<DerivedValue>);
      });
    }
  );

  return result;
};
```

The reason it's so short and easy, and the reason you get a nested write function for free, is because of a happy coincidence with how Immer works. 

At first, I thought the API would need to look like this:
```typescript
const anotherObjectAtom = createDerivedImmerAtom(
  bigAtomWithNestedObjects,
  bawno => bawno.anotherObject // forward the read
  (bawno, updatedOtherObject) => {
    bawno.anotherObject = updatedOtherObject
  }
);
```

Which is a bit annoying. But then, I realized the subsequent setter was unnecessary. Because Immer tracks sets on the objects themselves, we can just pass the object returned by `getDerivedValue` directly to the user provided `update` function. The user's function will modify that derived object, and Immer will track it all the same.

Pretty cool! I'm going to be using this all the time now :)