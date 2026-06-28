package repository

import (
	"context"

	"cloud.google.com/go/firestore"
)

type FirestoreRepo struct {
	Client *firestore.Client
}

func NewFirestoreRepo(client *firestore.Client) *FirestoreRepo {
	return &FirestoreRepo{Client: client}
}

func (r *FirestoreRepo) Collection(name string) *firestore.CollectionRef {
	return r.Client.Collection(name)
}

func (r *FirestoreRepo) Doc(path string) *firestore.DocumentRef {
	return r.Client.Doc(path)
}

func (r *FirestoreRepo) RunTransaction(ctx context.Context, fn func(ctx context.Context, tx *firestore.Transaction) error) error {
	return r.Client.RunTransaction(ctx, fn)
}
