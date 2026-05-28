import pandas as pd
import random
from tkinter import *

#csv file functions
def read_vocab_data():
    df = pd.read_csv('vocab_list.csv')
    print(df.to_string())  #print the entire DataFrame to the console

def add_vocab(term, definition):
    df = pd.DataFrame(columns=['Word', 'Definition']) #create an empty DataFrame with the specified columns
    new_row = pd.DataFrame({'Word': [term], 'Definition': [definition]}) # create a new DataFrame for the new row
    df = pd.concat([df, new_row], ignore_index=True) # concatenate the new row to the existing DataFrame
    df.to_csv('vocab_list.csv', mode='a', header=False, index=False) # append the new row to the CSV file without writing the header and index

def delete_vocab(index):
    df = pd.read_csv('vocab_list.csv') # read the CSV file into a DataFrame
    df = df.drop(index).reset_index(drop=True) # drop the row at the specified index
    df.to_csv('vocab_list.csv', index=False) # write the updated DataFrame back to the CSV file without the index


## vocab listbox functions
def update_vocab_listbox():
    word_listbox.delete(0, END) # clear the existing items in the listbox
    df = pd.read_csv('vocab_list.csv') # read the CSV file into a DataFrame
    for index, row in df.iterrows(): # iterate through each row in the DataFrame
        word_listbox.insert(END, row['Word']) # insert the 'Word' column value into the listbox

def add_new_vocab_listbox():
    word_entered = new_word_entry.get() # get the word entered in the entry widget 
    #slice entry to word and definition using a delimiter (e.g., ":") and store them in separate variables
    if "," in word_entered:
        word, definition = word_entered.split(",", 1) # split the entry into word and definition using "," as the delimiter
        add_vocab(word.strip(), definition.strip()) # call the add_vocab function to add the new vocabulary to the CSV file
        update_vocab_listbox() # update the listbox to reflect the new addition
        new_word_entry.delete(0, END) # clear the entry widget after adding the new vocabulary

def get_selected_vocab():
    selected_index = word_listbox.curselection()
    if selected_index:
        index = selected_index[0]  # convert tuple to integer
        selected_word = word_listbox.get(index)
        df = pd.read_csv('vocab_list.csv')
        definition = df.iloc[index]['Definition']
        print(f"Selected Word: {selected_word}, Definition: {definition}")
        return index

def delete_vocab_listbox():
    vocab_index = get_selected_vocab() # get the index of the selected vocabulary
    if vocab_index is not None:
        delete_vocab(vocab_index)
    update_vocab_listbox() # update the listbox to reflect the deletion


##flashcard functions
def flip_flashcard():
    current_text = flash_card_text.get()
    df = pd.read_csv('vocab_list.csv')
    if current_text in df['Word'].values:
        definition = df[df['Word'] == current_text]['Definition'].values[0]
        flash_card_text.set(definition)
    else:
        word = df[df['Definition'] == current_text]['Word'].values[0]
        flash_card_text.set(word)

def mark_answer_correct():
    df = pd.read_csv('vocab_list.csv')
    current_text = flash_card_text.get()
    if current_text in df['Word'].values:
        #update score for the word in the DataFrame (e.g., increment a "correct" column)
        df.loc[df['Word'] == current_text, 'Correct'] = df.loc[df['Word'] == current_text, 'Correct'].fillna(0) + 1
        df.loc[df['Word'] == current_text, 'Attempts'] = df.loc[df['Word'] == current_text, 'Attempts'].fillna(0) + 1
    else:
        #update score for the definition in the DataFrame (e.g., increment a "correct" column)
        df.loc[df['Definition'] == current_text, 'Correct'] = df.loc[df['Definition'] == current_text, 'Correct'].fillna(0) + 1
        df.loc[df['Definition'] == current_text, 'Attempts'] = df.loc[df['Definition'] == current_text, 'Attempts'].fillna(0) + 1
    df.to_csv('vocab_list.csv', index=False) # save the updated DataFrame back to the CSV file
    next_flashcard() # move to the next flashcard after marking the answer as correct

def mark_answer_wrong():
    df = pd.read_csv('vocab_list.csv')
    current_text = flash_card_text.get()
    if current_text in df['Word'].values:
        df.loc[df['Word'] == current_text, 'Attempts'] = df.loc[df['Word'] == current_text, 'Attempts'].fillna(0) + 1
    else:
        df.loc[df['Definition'] == current_text, 'Attempts'] = df.loc[df['Definition'] == current_text, 'Attempts'].fillna(0) + 1
    df.to_csv('vocab_list.csv', index=False) 
    next_flashcard() # move to the next flashcard after marking the answer as wrong

def next_flashcard():
    df = pd.read_csv('vocab_list.csv')
    if not df.empty:
        random_row = df.sample(n=1).iloc[0] # select a random row from the DataFrame
        flash_card_text.set(random_row['Word']) # set the flashcard text to the selected word

##Tkinter GUI setup
root = Tk()
mainframe = Frame(root)
root.title("Flashcard App")

#widgets
mainframe.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")

word_list_labelframe = LabelFrame(mainframe, text="Word List and settings")
word_list_labelframe.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
word_listbox = Listbox(word_list_labelframe)
word_listbox.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")


delete_vocab_button = Button(word_list_labelframe, text="Delete Vocabulary", command=delete_vocab_listbox)
delete_vocab_button.grid(row=2, column=0, padx=10, pady=10, sticky="nsew")

new_word_entry = Entry(word_list_labelframe)
new_word_entry.grid(row=1, column=0, padx=10, pady=10, sticky="nsew")

add_vocab_button = Button(word_list_labelframe, text="Add", command=add_new_vocab_listbox)
add_vocab_button.grid(row=1, column=1, padx=10, pady=10, sticky="nsew")


flashcard_menu_labelframe = LabelFrame(mainframe, text="Flashcard")
flashcard_menu_labelframe.grid(row=0, column=1, padx=10, pady=10, sticky="nsew")

flash_card_text = StringVar()
flash_card_button = Button(flashcard_menu_labelframe, textvariable=flash_card_text, command=flip_flashcard)
flash_card_button.grid(row=0, column=0, columnspan=2, padx=10, pady=10, sticky="nsew")
answer_correct_button = Button(flashcard_menu_labelframe, text="Correct", command=mark_answer_correct)
answer_correct_button.grid(row=1, column=0, padx=10, pady=10, sticky="nsew")
answer_wrong_button = Button(flashcard_menu_labelframe, text="Wrong", command=mark_answer_wrong)
answer_wrong_button.grid(row=1, column=1, padx=10, pady=10, sticky="nsew")

flash_card_text.set("test")
update_vocab_listbox()

#gridding

root.mainloop()