'use server';

import { revalidatePath } from 'next/cache';
import { auth, signIn, signOut } from './auth';
import { supabase } from './supabase';
import { getBookings } from './data-service';

export async function updateGuest(formData) {
	const session = await auth();
	if (!session) throw new Error('You must be signed in to update your profile');

	const nationalID = formData.get('nationalID');
	const [nationality, countryFlag] = formData.get('nationality').split('%');

	if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID))
		throw new Error('Please provide a valid national ID number');

	const updateData = { nationality, nationalID, countryFlag };

	const { data, error } = await supabase
		.from('guests')
		.update(updateData)
		.eq('id', session.user.guestId);

	if (error) throw new Error('Guest could not be updated');

	revalidatePath('/account/profile');
}

export async function deleteReservation(bookingId) {
	const session = await auth();
	if (!session)
		throw new Error('You must be signed in to delete a reservation!');

	const guestBookings = await getBookings(session.user.guestId);

	const guestBookingsIds = guestBookings.map((booking) => booking.id);

	if (!guestBookingsIds.includes(bookingId))
		throw new Error('You cannot delete a booking that does not belong to you!');

	const { error } = await supabase
		.from('bookings')
		.delete()
		.eq('id', bookingId);

	if (error) throw new Error('Booking could not be deleted');

	revalidatePath('/account/reservations');
}

export async function signInAction() {
	await signIn('google', { redirectTo: '/account' });
}

export async function signOutAction() {
	await signOut({ redirectTo: '/' });
}
