# LC-3 Practice Problems

---

## Problem 1: String Length (Easy)
**With Lesson**

### Problem Statement
Write a program to find the length of a null-terminated string stored in memory starting at location `x5000`. Store the length (number of characters, not including the null terminator) in memory location `x6000`.

### How to Think About This Problem

**Step 1: Understand what you have**
- A string starting at x5000
- Each character is at consecutive memory addresses: x5000, x5001, x5002...
- The string ends with a null character (x00)

**Step 2: What do you need?**
- Count how many characters before the null
- Store that count at x6000

**Step 3: Break it into pieces**
1. Set up a pointer to the start of the string
2. Set up a counter (starts at 0)
3. Load the character at the pointer
4. If it's null, we're done
5. If not null, increment counter, move pointer forward, repeat

**Step 4: Map to LC-3**
- R1 = pointer (address), starts at x5000
- R2 = counter, starts at 0
- Use `LDR R0, R1, #0` to load character at address R1
- Use `BRz` to check for null (null = 0, so BRz triggers)

### Solution Structure
```
.ORIG x3000
    LD R1, STRING_START    ; R1 = x5000 (pointer)
    AND R2, R2, #0         ; R2 = 0 (counter)
    
COUNT_LOOP
    LDR R0, R1, #0         ; load char at R1
    BRz DONE               ; if null, done
    ADD R2, R2, #1         ; increment counter
    ADD R1, R1, #1         ; move pointer forward
    BRnzp COUNT_LOOP
    
DONE
    STI R2, RESULT         ; store count at x6000
    HALT

STRING_START .FILL x5000
RESULT .FILL x6000
.END
```

---

## Problem 2: Count Vowels (Easy-Medium)

### Problem Statement
Write a program to count the number of vowels (A, E, I, O, U) in a null-terminated string stored at `x5000`. Store the count in memory location `x6000`. Assume all letters are uppercase.

### Hints
- You'll need to check each character against 5 different values
- ASCII values: A=x41, E=x45, I=x49, O=x4F, U=x55
- Use subtraction to compare: if (char - 'A') == 0, it's an 'A'

---

## Problem 3: Find Maximum (Medium)
**With Lesson**

### Problem Statement
An array of 10 signed integers is stored in memory starting at location `x5000`. Write a program to find the maximum value and store it at memory location `x6000`. Also store the index (0-9) of the maximum value at location `x6001`.

### How to Think About This Problem

**Step 1: Understand the data**
- 10 integers at x5000, x5001, x5002... x5009
- They're signed (can be negative)
- Need to find biggest one and where it is

**Step 2: Algorithm (think like a human first)**
- Assume first element is the max
- Look at each other element
- If it's bigger than current max, update max and remember its position
- After checking all, you have the answer

**Step 3: What registers do you need?**
- R1 = pointer to current element
- R2 = loop counter (count down from 10, or count up to 10)
- R3 = current max value
- R4 = index of current max
- R5 = current index being checked
- R0 = temporary for loading/comparing

**Step 4: The tricky part - comparing signed numbers**
To check if A > B:
- Compute A - B
- If result is positive, A > B

But be careful: if A is very positive and B is very negative, A - B might overflow. For this problem, assume no overflow.

**Step 5: Structure**
```
Initialize:
    R1 = x5000
    R3 = value at x5000 (first element = initial max)
    R4 = 0 (index of max)
    R5 = 1 (current index, start checking from second element)
    R1 = x5001 (point to second element)
    
Loop (9 times):
    Load value at R1 into R0
    Compare R0 with R3 (compute R0 - R3)
    If R0 > R3:
        R3 = R0 (new max)
        R4 = R5 (new max index)
    Increment R1 and R5
    Decrement counter
    If counter > 0, repeat
    
Store R3 at x6000
Store R4 at x6001
```

### Solution Structure
```
.ORIG x3000
    LD R1, ARRAY_START     ; R1 = x5000
    LDR R3, R1, #0         ; R3 = first element (initial max)
    AND R4, R4, #0         ; R4 = 0 (index of max)
    AND R5, R5, #0
    ADD R5, R5, #1         ; R5 = 1 (current index)
    ADD R1, R1, #1         ; point to second element
    
    LD R6, COUNT           ; R6 = 9 (check 9 more elements)
    
CHECK_LOOP
    LDR R0, R1, #0         ; R0 = current element
    
    ; Compare R0 with R3 (is R0 > R3?)
    NOT R2, R3
    ADD R2, R2, #1         ; R2 = -R3
    ADD R2, R0, R2         ; R2 = R0 - R3
    BRnz NOT_BIGGER        ; if R0 <= R3, skip update
    
    ; Update max
    ADD R3, R0, #0         ; R3 = R0 (new max)
    ADD R4, R5, #0         ; R4 = R5 (new index)
    
NOT_BIGGER
    ADD R1, R1, #1         ; move pointer
    ADD R5, R5, #1         ; increment current index
    ADD R6, R6, #-1        ; decrement counter
    BRp CHECK_LOOP         ; if counter > 0, continue
    
    STI R3, MAX_RESULT     ; store max value
    STI R4, INDEX_RESULT   ; store index
    HALT

ARRAY_START .FILL x5000
MAX_RESULT .FILL x6000
INDEX_RESULT .FILL x6001
COUNT .FILL #9
.END
```

---

## Problem 4: Reverse String In Place (Medium-Hard)

### Problem Statement
A null-terminated string is stored at memory location `x5000`. Write a program to reverse the string in place (modify the original memory). For example, "HELLO" becomes "OLLEH".

### Hints
- First find the end of the string (like in palindrome)
- Use two pointers: one at start, one at end
- Swap characters at those positions
- Move pointers toward each other
- Stop when they meet or cross
- To swap: need a temporary register to hold one value

---

## Problem 5: Binary to Decimal (Hard)

### Problem Statement
A null-terminated string at `x5000` contains only '0' and '1' characters representing a binary number (e.g., "1101"). Convert this to its decimal value and store the result at `x6000`. The binary number will be at most 8 bits (value 0-255).

### Hints
- '0' = x30, '1' = x31 in ASCII
- Process left to right
- For each digit: result = result * 2 + digit
- Example: "1101" → ((((0*2)+1)*2+1)*2+0)*2+1 = 13
- Multiplication by 2 is just adding the number to itself

---

## Problem 6: Remove Spaces (Hard)

### Problem Statement
A null-terminated string is stored at `x5000`. Write a program to remove all spaces from the string, modifying it in place. Store the new length (after removing spaces) at `x6000`.

Example: "H E L L O" becomes "HELLO" and store 5 at x6000.

### Hints
- Use two pointers: read pointer and write pointer
- Read pointer scans through original string
- Write pointer tracks where to write next non-space character
- Only write (and advance write pointer) when character is not a space
- At the end, write null terminator at write pointer position
- The difference between write pointer and start is the new length

---

## Key LC-3 Patterns to Remember

**Loading from an address stored in a register:**
```
LDR R0, R1, #0    ; R0 = memory[R1]
```

**Storing to an address stored in a register:**
```
STR R0, R1, #0    ; memory[R1] = R0
```

**Loading from a fixed address (indirect):**
```
LDI R0, ADDR      ; R0 = memory[memory[ADDR]]
STI R0, ADDR      ; memory[memory[ADDR]] = R0
ADDR .FILL x5000
```

**Comparing two values:**
```
NOT R2, R1
ADD R2, R2, #1    ; R2 = -R1
ADD R2, R0, R2    ; R2 = R0 - R1
BRz EQUAL
BRp R0_BIGGER
BRn R1_BIGGER
```

**Loop with counter:**
```
    LD R6, COUNT
LOOP
    ; ... do stuff ...
    ADD R6, R6, #-1
    BRp LOOP
```

**Scanning a string until null:**
```
LOOP
    LDR R0, R1, #0
    BRz DONE
    ; ... process R0 ...
    ADD R1, R1, #1
    BRnzp LOOP
DONE
```