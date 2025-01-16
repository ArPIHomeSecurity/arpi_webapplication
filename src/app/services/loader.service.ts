import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


export interface LoaderService {
  displayed: BehaviorSubject<boolean>;
  disabled: BehaviorSubject<boolean>;
  message: BehaviorSubject<string>;

  /**
   * Display the spinner on the page.
   * @param value Show or hide the spinner.
   */
  display(value: boolean);

  /**
   * Disable the page to avoid user interaction.
   * @param value Enable or disable the page.
   */
  disable(value: boolean);

  /**
   * Set the message to be displayed on the page as alert.
   * @param message The message to be displayed.
   */
  setMessage(message: string);

  /**
   * Clear the message displayed on the page.
   */
  clearMessage();
}
